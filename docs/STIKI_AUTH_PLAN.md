# Chibitek Stiki Authentication Integration Plan

> **Date:** 2026-05-16  
> **Status:** Planning Phase  
> **Priority:** P1 (Post-Supabase foundation)

---

## 🎯 Objective

Enable Atomic Chat users to authenticate via **Chibitek Stiki** — the Chibitek Labs identity platform. This provides:
- Single Sign-On (SSO) across Chibitek products
- Organization/team workspace support
- Role-based access control (RBAC)
- Secure token exchange

---

## 🔗 Architecture Overview

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Atomic Chat    │────▶│  Chibitek Stiki  │────▶│  Supabase Auth  │
│  (Client App)   │◄────│  (Identity Hub)  │◄────│  (JWT Provider) │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                        │                        │
        │                        │                        │
        ▼                        ▼                        ▼
   ┌─────────┐            ┌──────────┐            ┌──────────┐
   │  User   │            │  OAuth2  │            │  PostgreSQL│
   │ Device  │            │  Flow    │            │  (Users)   │
   └─────────┘            └──────────┘            └──────────┘
```

**Flow:**
1. User clicks "Sign in with Chibitek" in Atomic Chat
2. App redirects to Stiki OAuth2 authorization endpoint
3. Stiki authenticates user (email/password, SSO, or MFA)
4. Stiki redirects back with authorization code
5. Atomic Chat exchanges code for Stiki access token
6. Stiki token is exchanged for Supabase JWT (via Edge Function)
7. Supabase JWT is used for all subsequent API calls

---

## 📋 Implementation Steps

### Phase 1: Stiki OAuth2 Client Registration (Manual Setup)

**Required from Chibitek Stiki team:**
- [ ] Register Atomic Chat as an OAuth2 client in Stiki
- [ ] Obtain `client_id` and `client_secret`
- [ ] Configure redirect URI: `https://atomic.chat/auth/callback`
- [ ] Request scopes: `openid profile email stiki:read stiki:teams`
- [ ] Receive Stiki OAuth2 endpoints:
  - Authorization URL: `https://auth.chibitek.com/oauth/authorize`
  - Token URL: `https://auth.chibitek.com/oauth/token`
  - UserInfo URL: `https://auth.chibitek.com/oauth/userinfo`

**Configuration in Atomic Chat:**
```env
# .env or runtime config
VITE_STIKI_CLIENT_ID=atomic-chat-client-id
VITE_STIKI_AUTH_URL=https://auth.chibitek.com/oauth/authorize
VITE_STIKI_TOKEN_URL=https://auth.chibitek.com/oauth/token
VITE_STIKI_USERINFO_URL=https://auth.chibitek.com/oauth/userinfo
```

---

### Phase 2: Supabase Edge Function (Token Exchange)

**Purpose:** Securely exchange Stiki token for Supabase JWT without exposing secrets client-side.

**File:** `supabase/functions/stiki-auth/index.ts`

```typescript
import { createClient } from '@supabase/supabase-js'

Deno.serve(async (req) => {
  const { stiki_access_token } = await req.json()

  // 1. Validate Stiki token with Stiki UserInfo endpoint
  const userInfoRes = await fetch('https://auth.chibitek.com/oauth/userinfo', {
    headers: { Authorization: `Bearer ${stiki_access_token}` }
  })

  if (!userInfoRes.ok) {
    return new Response(JSON.stringify({ error: 'Invalid Stiki token' }), { status: 401 })
  }

  const stikiUser = await userInfoRes.json()

  // 2. Find or create user in Supabase Auth
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('stiki_id', stikiUser.sub)
    .single()

  let userId = existingUser?.id

  if (!userId) {
    // Create new user linked to Stiki identity
    const { data: newUser, error } = await supabase.auth.admin.createUser({
      email: stikiUser.email,
      user_metadata: {
        stiki_id: stikiUser.sub,
        name: stikiUser.name,
        avatar: stikiUser.picture,
        organization: stikiUser.org_id,
      },
      email_confirm: true,
    })

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    userId = newUser.user.id
  }

  // 3. Generate Supabase JWT for this user
  const { data: { session }, error: signInError } = await supabase.auth.admin.signInWithIdToken({
    provider: 'oidc',
    token: stiki_access_token,
  })

  if (signInError) {
    return new Response(JSON.stringify({ error: signInError.message }), { status: 500 })
  }

  return new Response(JSON.stringify({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_in: session.expires_in,
    user: session.user,
  }))
})
```

---

### Phase 3: Atomic Chat Client Integration

**New File:** `web-app/src/services/auth/stiki.ts`

```typescript
/**
 * Chibitek Stiki OAuth2 Authentication
 *
 * Implements the OAuth2 Authorization Code flow with PKCE
 * for secure authentication via Chibitek Stiki.
 */

import { generatePKCE } from '@/lib/pkce'
import { supabase } from '@/lib/supabase'

const STIKI_CLIENT_ID = import.meta.env.VITE_STIKI_CLIENT_ID
const STIKI_AUTH_URL = import.meta.env.VITE_STIKI_AUTH_URL
const STIKI_TOKEN_URL = import.meta.env.VITE_STIKI_TOKEN_URL
const REDIRECT_URI = `${window.location.origin}/auth/callback`

export class StikiAuthService {
  /**
   * Step 1: Initiate OAuth2 flow
   * Generates PKCE and opens Stiki authorization URL
   */
  async signIn(): Promise<{ error?: string; url?: string }> {
    const { codeVerifier, codeChallenge } = await generatePKCE()

    // Store code verifier for callback
    sessionStorage.setItem('stiki_code_verifier', codeVerifier)

    const params = new URLSearchParams({
      client_id: STIKI_CLIENT_ID,
      response_type: 'code',
      redirect_uri: REDIRECT_URI,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      scope: 'openid profile email stiki:read stiki:teams',
      state: crypto.randomUUID(),
    })

    return { url: `${STIKI_AUTH_URL}?${params.toString()}` }
  }

  /**
   * Step 2: Handle OAuth callback
   * Exchanges authorization code for Stiki token, then Supabase token
   */
  async handleCallback(code: string): Promise<{ error?: string; session?: any }> {
    const codeVerifier = sessionStorage.getItem('stiki_code_verifier')
    if (!codeVerifier) return { error: 'PKCE verifier not found' }

    // Exchange code for Stiki access token
    const tokenRes = await fetch(STIKI_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: STIKI_CLIENT_ID,
        code,
        redirect_uri: REDIRECT_URI,
        code_verifier: codeVerifier,
      }),
    })

    if (!tokenRes.ok) {
      return { error: 'Failed to exchange authorization code' }
    }

    const stikiToken = await tokenRes.json()

    // Exchange Stiki token for Supabase session via Edge Function
    const supabaseRes = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stiki-auth`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stiki_access_token: stikiToken.access_token }),
      }
    )

    if (!supabaseRes.ok) {
      return { error: 'Failed to create Supabase session' }
    }

    const { access_token, refresh_token } = await supabaseRes.json()

    // Set Supabase session
    const { data, error } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    })

    if (error) return { error: error.message }

    return { session: data.session }
  }
}
```

---

### Phase 4: UI Integration

**Add to Settings → General:**
- "Sign in with Chibitek" button (when not authenticated)
- "Linked to Chibitek: user@org.com" (when authenticated)
- "Organization: Chibitek Labs" (if org info available)

**Add to Onboarding Flow:**
- Step: "Choose your identity provider"
- Options: "Chibitek Stiki" | "Email/Password" | "Skip (Local only)"

---

### Phase 5: RBAC & Permissions

**Stiki provides organization roles that map to Atomic Chat permissions:**

| Stiki Role | Atomic Chat Permission |
|------------|------------------------|
| `org:admin` | Full admin (settings, billing, users) |
| `org:member` | Standard user (chat, threads, models) |
| `org:guest` | Limited user (read-only, no model changes) |

**Implementation:**
- Store `organization_id` and `role` in Supabase `user_metadata`
- Check role in UI for feature gating
- Use RLS policies in Supabase for data isolation

---

## 🔐 Security Considerations

1. **PKCE Required:** Always use PKCE for OAuth2 flow (prevents authorization code interception)
2. **Token Exchange Server-Side:** Stiki token → Supabase JWT happens in Edge Function, never client-side
3. **Short-Lived Tokens:** Stiki access tokens expire in 15 minutes; Supabase handles refresh
4. **State Parameter:** Prevent CSRF attacks with `state` parameter
5. **HTTPS Only:** All OAuth2 flows require HTTPS (enforced by Stiki)

---

## 📁 Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `supabase/functions/stiki-auth/index.ts` | Create | Edge Function for token exchange |
| `web-app/src/services/auth/stiki.ts` | Create | Stiki OAuth2 client |
| `web-app/src/services/auth/types.ts` | Modify | Add Stiki to AuthService interface |
| `web-app/src/routes/auth/callback.tsx` | Create | OAuth callback handler route |
| `web-app/src/routes/settings/general.tsx` | Modify | Add Stiki sign-in UI |
| `web-app/.env.example` | Modify | Add Stiki environment variables |

---

## ⚠️ Blockers / Dependencies

1. **Chibitek Stiki OAuth2 endpoints** — Need actual URLs from Stiki team
2. **Client registration** — Need `client_id` from Stiki
3. **Supabase Edge Functions** — Need Supabase project with Functions enabled
4. **CORS configuration** — Stiki must allow `atomic.chat` origin

---

## ✅ Acceptance Criteria

- [ ] User can click "Sign in with Chibitek" and be redirected to Stiki
- [ ] After Stiki auth, user is automatically signed into Atomic Chat
- [ ] Supabase session is created with Stiki user info
- [ ] User's organization/team info is available in app
- [ ] Sign out clears both Stiki and Supabase sessions
- [ ] Works on web, desktop (Tauri), and mobile (iOS/Android)

---

*Document version: 1.0*  
*Last updated: 2026-05-16*
