# Chibitek Stiki Auth Integration Plan

> **Status:** Planning / Future Implementation  
> **Priority:** P2 (not required for initial release)  
> **Owner:** Chibitek Platform Team

---

## Overview

This document outlines the integration points for **Chibitek Stiki** — Chibitek's internal authentication and identity platform — into Atomic Chat. Stiki provides:

- **OAuth 2.0 / OIDC** authentication
- **Multi-tenant** organisation support
- **Role-based access control (RBAC)**
- **API key management** for service-to-service auth
- **User profile sync** across Chibitek products

---

## Architecture

```
┌─────────────────────────────────────────┐
│  Atomic Chat (macOS / iOS / Web)        │
│  ┌─────────────────────────────────┐    │
│  │  Auth Provider (React Context)  │    │
│  │  ├─ Supabase Auth (current)     │    │
│  │  └─ Stiki Auth (future)         │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│  Stiki Identity Provider                │
│  ├─ OAuth 2.0 Authorization Server      │
│  ├─ OIDC UserInfo Endpoint              │
│  └─ Token Introspection                 │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│  Supabase (Data Layer)                  │
│  ├─ PostgreSQL (threads, messages)      │
│  ├─ Auth (can be disabled when Stiki)   │
│  └─ RLS policies (check Stiki claims)   │
└─────────────────────────────────────────┘
```

---

## Integration Points

### 1. Authentication Flow

**Current (Supabase Auth):**
```
User → Supabase Auth (email/password, OAuth) → JWT → Supabase DB
```

**Future (Stiki Auth):**
```
User → Stiki Login (OAuth 2.0) → Stiki JWT → Atomic Chat
                                    │
                                    ▼
                              Supabase DB (RLS checks Stiki sub)
```

**Implementation:**
- Replace `supabase.auth.signInWithOAuth()` with Stiki OAuth redirect
- Store Stiki access token in secure storage (Tauri `plugin-store` or iOS Keychain)
- Use Stiki token as Bearer auth for API calls

---

### 2. User Identity Mapping

**Stiki User → Supabase User:**

| Stiki Claim | Supabase Column | Usage |
|-------------|-----------------|-------|
| `sub` (user ID) | `auth.users.id` | Primary key mapping |
| `email` | `auth.users.email` | Contact / notifications |
| `org_id` | `threads.org_id` (new) | Multi-tenant isolation |
| `roles` | RLS policy check | Feature gating |

**Migration Path:**
1. Add `stiki_sub` column to `auth.users` (or custom users table)
2. On first Stiki login, create/link Supabase user
3. Subsequent logins match by `stiki_sub`

---

### 3. Code Changes Required

#### A. Auth Service (`web-app/src/services/auth/stiki.ts`)

```typescript
export class StikiAuthService {
  private stikiBaseUrl: string
  private clientId: string

  constructor() {
    this.stikiBaseUrl = import.meta.env.VITE_STIKI_URL ?? ''
    this.clientId = import.meta.env.VITE_STIKI_CLIENT_ID ?? ''
  }

  async signIn(): Promise<void> {
    // OAuth 2.0 Authorization Code flow
    const state = generateRandomState()
    const redirectUri = `${window.location.origin}/auth/stiki/callback`

    const authUrl = new URL(`${this.stikiBaseUrl}/oauth/authorize`)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('client_id', this.clientId)
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('scope', 'openid profile email')
    authUrl.searchParams.set('state', state)

    // Store state for CSRF protection
    localStorage.setItem('stiki_auth_state', state)

    // Redirect to Stiki login
    window.location.href = authUrl.toString()
  }

  async handleCallback(code: string, state: string): Promise<void> {
    // Verify state
    const storedState = localStorage.getItem('stiki_auth_state')
    if (state !== storedState) {
      throw new Error('Invalid state parameter')
    }

    // Exchange code for tokens
    const tokenResponse = await fetch(`${this.stikiBaseUrl}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        client_id: this.clientId,
        redirect_uri: `${window.location.origin}/auth/stiki/callback`,
      }),
    })

    const tokens = await tokenResponse.json()

    // Store tokens securely
    await this.storeTokens(tokens)

    // Sync user to Supabase
    await this.syncUserToSupabase(tokens.access_token)
  }

  private async syncUserToSupabase(accessToken: string): Promise<void> {
    // Call Stiki UserInfo endpoint
    const userInfo = await fetch(`${this.stikiBaseUrl}/oauth/userinfo`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    }).then((r) => r.json())

    // Upsert user in Supabase
    const { error } = await supabase
      .from('users')
      .upsert({
        stiki_sub: userInfo.sub,
        email: userInfo.email,
        name: userInfo.name,
        org_id: userInfo.org_id,
        updated_at: new Date().toISOString(),
      })

    if (error) throw error
  }
}
```

#### B. RLS Policy Updates (`supabase/schema.sql`)

```sql
-- Add org_id to threads for multi-tenant isolation
ALTER TABLE public.threads ADD COLUMN IF NOT EXISTS org_id UUID;

-- Update RLS policies to check Stiki claims
CREATE OR REPLACE FUNCTION auth.user_org_id()
RETURNS UUID AS $$
BEGIN
  -- Extract org_id from JWT claim
  RETURN (auth.jwt() ->> 'org_id')::UUID;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Multi-tenant thread policy
CREATE POLICY "Users can access threads in their org"
  ON public.threads
  FOR ALL
  USING (
    org_id = auth.user_org_id()
    OR org_id IS NULL  -- Personal threads
  );
```

#### C. Service Hub Integration (`web-app/src/services/index.ts`)

```typescript
// Add to ServiceHub interface
export interface ServiceHub {
  // ... existing services
  auth(): AuthService  // Abstract over Supabase / Stiki
}

// Platform-specific auth service selection
if (isPlatformTauri() && import.meta.env.VITE_AUTH_PROVIDER === 'stiki') {
  const { StikiAuthService } = await import('./auth/stiki')
  this.authService = new StikiAuthService()
} else {
  this.authService = supabaseAuth
}
```

---

### 4. Environment Variables

```bash
# .env (web-app)
VITE_AUTH_PROVIDER=supabase        # or 'stiki'
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=...

# Stiki-specific (optional)
VITE_STIKI_URL=https://auth.chibitek.com
VITE_STIKI_CLIENT_ID=atomic-chat-client
```

---

### 5. Security Considerations

| Concern | Mitigation |
|---------|------------|
| Token storage | Use Tauri `plugin-store` (encrypted) or iOS Keychain |
| Token refresh | Implement refresh token rotation via Stiki |
| Session expiry | Handle 401 → redirect to Stiki re-auth |
| Org isolation | RLS policies enforce `org_id` match |
| API key encryption | Continue using client-side AES-256-GCM |

---

### 6. Migration Path

| Phase | Action | Timeline |
|-------|--------|----------|
| 1 | Ship with Supabase Auth only | v1.2 |
| 2 | Add Stiki auth as opt-in | v1.3 |
| 3 | Support both simultaneously | v1.4 |
| 4 | Deprecate Supabase Auth (if desired) | v2.0 |

---

### 7. Files to Create / Modify

| File | Action | Description |
|------|--------|-------------|
| `web-app/src/services/auth/stiki.ts` | Create | Stiki OAuth service |
| `web-app/src/services/auth/types.ts` | Create | Shared auth interface |
| `web-app/src/routes/auth/stiki/callback.tsx` | Create | OAuth callback handler |
| `supabase/schema.sql` | Modify | Add `stiki_sub`, `org_id` columns |
| `web-app/src/services/index.ts` | Modify | Wire auth provider selection |
| `web-app/src/providers/AuthProvider.tsx` | Modify | Support multiple auth backends |

---

## Open Questions

1. **Does Stiki support PKCE?** Required for mobile app OAuth security.
2. **Token format?** JWT? Opaque? Affects client-side parsing.
3. **Refresh token expiry?** Determines session lifetime.
4. **Org switching?** Can users belong to multiple orgs?
5. **SSO/SAML?** Enterprise customers may need SAML integration.

---

## Next Steps

1. **Review with Stiki team** — Confirm OAuth endpoints, claims, token format
2. **Prototype auth flow** — Build minimal Stiki login/logout in dev environment
3. **Update schema** — Add Stiki columns to Supabase
4. **Implement service** — Build `StikiAuthService` behind feature flag
5. **Test on iOS** — Verify Keychain token storage, deep link callback

---

*Document version: 1.0*  
*Last updated: 2026-05-16*
