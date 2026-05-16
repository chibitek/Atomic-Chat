/**
 * Encrypted Provider Settings Service
 *
 * Stores provider API keys encrypted with the user's Supabase session token
 * as the password.  The plaintext key is never stored server-side.
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { supabaseAuth } from '@/services/auth/supabase'
import { encrypt, decrypt, serialisePayload, deserialisePayload } from '@/lib/crypto'

export interface EncryptedProviderSetting {
  provider: string
  encrypted_api_key: string
  base_url?: string
  settings?: Record<string, unknown>
}

export class EncryptedProviderSettingsService {
  /**
   * Save a provider's API key encrypted.
   *
   * @param provider   Provider name (e.g. 'openai', 'anthropic')
   * @param apiKey     Plaintext API key
   * @param baseUrl    Optional base URL override
   * @param settings   Optional extra settings
   */
  async saveProviderKey(
    provider: string,
    apiKey: string,
    baseUrl?: string,
    settings?: Record<string, unknown>
  ): Promise<{ error?: string }> {
    if (!isSupabaseConfigured) {
      return { error: 'Supabase not configured' }
    }

    const token = await supabaseAuth.getAccessToken()
    if (!token) {
      return { error: 'Not authenticated' }
    }

    const encrypted = await encrypt(apiKey, token)
    const encrypted_api_key = serialisePayload(encrypted)

    const { error } = await supabase
      .from('provider_settings')
      .upsert(
        {
          provider,
          encrypted_api_key,
          base_url: baseUrl ?? null,
          settings: settings ?? {},
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,provider' }
      )

    if (error) {
      console.error('[EncryptedProviderSettings] save error:', error)
      return { error: error.message }
    }

    return {}
  }

  /**
   * Load and decrypt a provider's API key.
   *
   * @param provider  Provider name
   * @returns Plaintext API key, or null if not found / can't decrypt.
   */
  async loadProviderKey(provider: string): Promise<{
    apiKey: string | null
    baseUrl?: string
    settings?: Record<string, unknown>
    error?: string
  }> {
    if (!isSupabaseConfigured) {
      return { apiKey: null, error: 'Supabase not configured' }
    }

    const token = await supabaseAuth.getAccessToken()
    if (!token) {
      return { apiKey: null, error: 'Not authenticated' }
    }

    const { data, error } = await supabase
      .from('provider_settings')
      .select('encrypted_api_key, base_url, settings')
      .eq('provider', provider)
      .single()

    if (error || !data) {
      return { apiKey: null, error: error?.message }
    }

    const payload = deserialisePayload(data.encrypted_api_key)
    if (!payload) {
      return { apiKey: null, error: 'Invalid encrypted payload' }
    }

    const apiKey = await decrypt(payload, token)
    return {
      apiKey,
      baseUrl: data.base_url ?? undefined,
      settings: (data.settings as Record<string, unknown>) ?? undefined,
    }
  }

  /**
   * Delete a provider's stored settings.
   */
  async deleteProviderKey(provider: string): Promise<{ error?: string }> {
    if (!isSupabaseConfigured) {
      return { error: 'Supabase not configured' }
    }

    const { error } = await supabase
      .from('provider_settings')
      .delete()
      .eq('provider', provider)

    if (error) {
      return { error: error.message }
    }
    return {}
  }

  /**
   * List all stored provider settings (without decrypting keys).
   */
  async listProviders(): Promise<{
    providers: Array<{ provider: string; baseUrl?: string }>
    error?: string
  }> {
    if (!isSupabaseConfigured) {
      return { providers: [], error: 'Supabase not configured' }
    }

    const { data, error } = await supabase
      .from('provider_settings')
      .select('provider, base_url')

    if (error) {
      return { providers: [], error: error.message }
    }

    return {
      providers:
        data?.map((row) => ({
          provider: row.provider as string,
          baseUrl: (row.base_url as string) ?? undefined,
        })) ?? [],
    }
  }
}

/** Singleton */
export const encryptedProviderSettings = new EncryptedProviderSettingsService()
