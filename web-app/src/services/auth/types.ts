/**
 * Auth Service Types
 */

export interface AuthUser {
  id: string
  email?: string
  name?: string
  avatar?: string
}

export interface AuthSession {
  user: AuthUser | null
  accessToken: string | null
  isLoading: boolean
}

export interface AuthService {
  /** Current auth state */
  getState(): AuthSession

  /** Subscribe to auth state changes */
  subscribe(listener: (state: AuthSession) => void): () => void

  /** Sign up with email/password */
  signUp(email: string, password: string): Promise<{ error?: string }>

  /** Sign in with email/password */
  signIn(email: string, password: string): Promise<{ error?: string }>

  /** Sign in with OAuth provider */
  signInWithOAuth(provider: string): Promise<{ error?: string; url?: string }>

  /** Sign out */
  signOut(): Promise<void>

  /** Reset password */
  resetPassword(email: string): Promise<{ error?: string }>

  /** Update password */
  updatePassword(newPassword: string): Promise<{ error?: string }>

  /** Get access token for API calls */
  getAccessToken(): Promise<string | null>
}
