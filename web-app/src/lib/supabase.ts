import { createClient, SupabaseClient } from '@supabase/supabase-js'

/**
 * Supabase client singleton.
 *
 * Environment variables (Vite):
 *   VITE_SUPABASE_URL      – project URL
 *   VITE_SUPABASE_ANON_KEY – public anon key
 *
 * When variables are absent the client is created in an un-initialised state
 * and all calls safely no-op so the app can still run in pure-local mode.
 */

const supabaseUrl =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? ''
const supabaseAnonKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? ''

export const isSupabaseConfigured =
  supabaseUrl.length > 0 && supabaseAnonKey.length > 0

export const supabase: SupabaseClient = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
)

/** Helper that throws when Supabase is not configured. */
export function assertSupabase(): void {
  if (!isSupabaseConfigured) {
    throw new Error(
      'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
    )
  }
}
