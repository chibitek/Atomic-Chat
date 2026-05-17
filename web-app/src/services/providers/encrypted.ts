/**
 * Encrypted Provider Settings Service
 *
 * Stores provider API keys encrypted client-side before they reach Supabase.
 * The encryption key is derived from the user's stable account id — NOT the
 * rotating session token, which would make ciphertext undecryptable after the
 * next token refresh (~1h). Note: the user id is not secret, so this is
 * obfuscation-at-rest, not end-to-end confidentiality (see issue AS-2).
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { encrypt, decrypt, serialisePayload, deserialisePayload } from '@/lib/crypto'

export interface EncryptedProviderSetting {
  provider: string
  encrypted_api_key: string
  base_url?: string
  settings?: Record<string, unknown>
}

export class EncryptedProviderSettingsService {
  /**
   * Stable per-user secret used to derive the encryption key. The user id is
   * constant for the account's lifetime, so ciphertext stays decryptable
   * across session refreshes (unlike the access token — see AS-1).
   */
  private async getEncryptionSecret(): Promise<string | null> {
    const { data } = await supabase.auth.getUser()
    return data.user?.id ?? null
  }

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

    const secret = await this.getEncryptionSecret()
    if (!secret) {
      return { error: 'Not authenticated' }
    }

    const encrypted = await encrypt(apiKey, secret)
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

    const secret = await this.getEncryptionSecret()
    if (!secret) {
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

    const apiKey = await decrypt(payload, secret)
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
