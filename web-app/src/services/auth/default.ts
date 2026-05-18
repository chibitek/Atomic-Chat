/**
 * Default Auth Service (local-only, no authentication)
 */

import type { AuthService, AuthSession } from './types'

export class DefaultAuthService implements AuthService {
  private state: AuthSession = {
    user: null,
    accessToken: null,
    isLoading: false,
  }

  private listeners: Set<(state: AuthSession) => void> = new Set()

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

  async signUp(): Promise<{ error?: string }> {
    return { error: 'Authentication not available in local mode' }
  }

  async signIn(): Promise<{ error?: string }> {
    return { error: 'Authentication not available in local mode' }
  }

  async signInWithOAuth(): Promise<{ error?: string; url?: string }> {
    return { error: 'Authentication not available in local mode' }
  }

  async signOut(): Promise<void> {
    // No-op
  }

  async resetPassword(): Promise<{ error?: string }> {
    return { error: 'Authentication not available in local mode' }
  }

  async updatePassword(): Promise<{ error?: string }> {
    return { error: 'Authentication not available in local mode' }
  }

  async getAccessToken(): Promise<string | null> {
    return null
  }
}
