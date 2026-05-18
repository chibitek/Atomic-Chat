/**
 * Supabase Auth Service
 *
 * Wraps Supabase Auth for email/password, OAuth, and session management.
 * Implements the AuthService interface for Service Hub integration.
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { AuthService, AuthSession } from './types'
import type { Provider as SupabaseOAuthProvider } from '@supabase/supabase-js'

export class SupabaseAuthService implements AuthService {
  private state: AuthSession = {
    user: null,
    accessToken: null,
    isLoading: true,
  }

  private listeners: Set<(state: AuthSession) => void> = new Set()

  constructor() {
    if (!isSupabaseConfigured) {
      this.state.isLoading = false
      return
    }

    // Listen for auth state changes
    supabase.auth.onAuthStateChange((_event, session) => {
      this.state = {
        user: session?.user
          ? {
              id: session.user.id,
              email: session.user.email,
              name: session.user.user_metadata?.name,
              avatar: session.user.user_metadata?.avatar_url,
            }
          : null,
        accessToken: session?.access_token ?? null,
        isLoading: false,
      }
      this.notify()
    })

    // Initial session check
    supabase.auth.getSession().then(({ data }) => {
      const session = data.session
      this.state = {
        user: session?.user
          ? {
              id: session.user.id,
              email: session.user.email,
              name: session.user.user_metadata?.name,
              avatar: session.user.user_metadata?.avatar_url,
            }
          : null,
        accessToken: session?.access_token ?? null,
        isLoading: false,
      }
      this.notify()
    })
  }

  getState(): AuthSession {
    return this.state
  }

  subscribe(listener: (state: AuthSession) => void): () => void {
    this.listeners.add(listener)
    listener(this.state)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private notify(): void {
    this.listeners.forEach((l) => l(this.state))
  }

  async signUp(email: string, password: string): Promise<{ error?: string }> {
    if (!isSupabaseConfigured) return { error: 'Supabase not configured' }

    const { error } = await supabase.auth.signUp({ email, password })
    return { error: error?.message }
  }

  async signIn(email: string, password: string): Promise<{ error?: string }> {
    if (!isSupabaseConfigured) return { error: 'Supabase not configured' }

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message }
  }

  async signInWithOAuth(provider: string): Promise<{ error?: string; url?: string }> {
    if (!isSupabaseConfigured) return { error: 'Supabase not configured' }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: provider as SupabaseOAuthProvider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    return { error: error?.message ?? undefined, url: data?.url ?? undefined }
  }

  async signOut(): Promise<void> {
    if (!isSupabaseConfigured) return
    await supabase.auth.signOut()
  }

  async resetPassword(email: string): Promise<{ error?: string }> {
    if (!isSupabaseConfigured) return { error: 'Supabase not configured' }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    return { error: error?.message }
  }

  async updatePassword(newPassword: string): Promise<{ error?: string }> {
    if (!isSupabaseConfigured) return { error: 'Supabase not configured' }

    const { error } = await supabase.auth.updateUser({ password: newPassword })
    return { error: error?.message }
  }

  async getAccessToken(): Promise<string | null> {
    if (!isSupabaseConfigured) return null
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token ?? null
  }
}
