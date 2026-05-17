/**
 * Client-side encryption utilities for API keys.
 *
 * Uses AES-256-GCM via the Web Crypto API with a key derived from the
 * user's Supabase session token via PBKDF2.  The encrypted payload is
 * stored in Supabase; plaintext never leaves the client.
 */

const ALGORITHM = 'AES-GCM'
const IV_LENGTH = 12
const SALT_LENGTH = 32
const KEY_LENGTH = 32
// OWASP 2023 guidance for PBKDF2-SHA256 (AS-2).
const ITERATIONS = 600_000
const DIGEST = 'SHA-256'

export interface EncryptedPayload {
  encrypted: string
  salt: string
  iv: string
}

/**
 * Derive an AES-256 key from a password/token using PBKDF2.
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const passwordBuffer = encoder.encode(password)

  const baseKey = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveKey']
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as ArrayBuffer,
      iterations: ITERATIONS,
      hash: DIGEST,
    },
    baseKey,
    { name: ALGORITHM, length: KEY_LENGTH * 8 },
    false,
    ['encrypt', 'decrypt']
  )
}

/**
 * Encrypt a plaintext string.
 *
 * @param plainText  The API key or other secret to encrypt.
 * @param password   The user's session token or a derived secret.
 * @returns JSON-serialisable payload.
 */
export async function encrypt(plainText: string, password: string): Promise<EncryptedPayload> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
  const key = await deriveKey(password, salt)

  const encoder = new TextEncoder()
  const plainBuffer = encoder.encode(plainText)

  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    plainBuffer
  )

  return {
    encrypted: arrayBufferToBase64(encryptedBuffer),
    salt: arrayBufferToBase64(salt.buffer),
    iv: arrayBufferToBase64(iv.buffer),
  }
}

/**
 * Decrypt an encrypted payload.
 *
 * @param payload   The payload returned by {@link encrypt}.
 * @param password  The same password/token used for encryption.
 * @returns Plaintext string, or null if decryption fails.
 */
export async function decrypt(payload: EncryptedPayload, password: string): Promise<string | null> {
  try {
    const salt = new Uint8Array(base64ToArrayBuffer(payload.salt))
    const iv = new Uint8Array(base64ToArrayBuffer(payload.iv))
    const encrypted = base64ToArrayBuffer(payload.encrypted)
    const key = await deriveKey(password, salt)

    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv },
      key,
      encrypted
    )

    const decoder = new TextDecoder()
    return decoder.decode(decryptedBuffer)
  } catch (error) {
    console.error('[crypto] Decryption failed:', error)
    return null
  }
}

/**
 * Serialise an encrypted payload to a single string for DB storage.
 */
export function serialisePayload(payload: EncryptedPayload): string {
  return JSON.stringify(payload)
}

/**
 * Deserialise a payload string back to an EncryptedPayload object.
 */
export function deserialisePayload(serialised: string): EncryptedPayload | null {
  try {
    return JSON.parse(serialised) as EncryptedPayload
  } catch {
    return null
  }
}

// ── Helpers ─────────────────────────────────────────────────────────

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}
