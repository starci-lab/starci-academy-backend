/** AES-GCM encrypted payload (iv, ciphertext, authTag as Base64 strings). */
export interface EncryptedPayload {
    /** Base64-encoded AES-GCM initialization vector (nonce). */
    iv: string
    /** Base64-encoded encrypted ciphertext. */
    ciphertext: string
    /** Base64-encoded AES-GCM authentication tag for integrity verification. */
    authTag: string
}
