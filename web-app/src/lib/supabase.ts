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

//* createClient throws "supabaseUrl is required." on an empty URL. That throw
//* happens at module load, aborts the whole import graph, and leaves the app
//* stuck on the HTML loading spinner forever. When Supabase is not configured
//* we pass harmless placeholders instead; isSupabaseConfigured stays false so
//* every caller (and assertSupabase) no-ops and the app runs in local-only mode.
export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'http://localhost',
  supabaseAnonKey || 'public-anon-key',
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
