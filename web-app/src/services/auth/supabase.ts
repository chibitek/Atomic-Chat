/**
 * Supabase Auth Service
 *
 * Wraps Supabase Auth for email/password, magic link, OAuth, and session
 * management.  Falls back silently when Supabase is not configured.
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { User, Session, Provider as SupabaseOAuthProvider } from '@supabase/supabase-js'

export interface AuthState {
  user: User | null
  session: Session | null
  isLoading: boolean
}

export class SupabaseAuthService {
  private state: AuthState = {
    user: null,
    session: null,
    isLoading: true,
  }

  private listeners: Set<(state: AuthState) => void> = new Set()

  constructor() {
    if (!isSupabaseConfigured) {
      this.state.isLoading = false
      return
    }

    // Listen for auth state changes
    supabase.auth.onAuthStateChange((_event, session) => {
      this.state = {
        user: session?.user ?? null,
        session,
        isLoading: false,
      }
      this.notify()
    })

    // Initial session check
    supabase.auth.getSession().then(({ data }) => {
      this.state = {
        user: data.session?.user ?? null,
        session: data.session,
        isLoading: false,
      }
      this.notify()
    })
  }

  getState(): AuthState {
    return this.state
  }

  subscribe(listener: (state: AuthState) => void): () => void {
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

  async signInWithOAuth(provider: SupabaseOAuthProvider): Promise<{ error?: string; url?: string }> {
    if (!isSupabaseConfigured) return { error: 'Supabase not configured' }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    return { error: error?.message, url: data?.url }
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

  /** Returns the current JWT access token (for API calls). */
  async getAccessToken(): Promise<string | null> {
    if (!isSupabaseConfigured) return null
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token ?? null
  }
}

/** Singleton instance */
export const supabaseAuth = new SupabaseAuthService()
