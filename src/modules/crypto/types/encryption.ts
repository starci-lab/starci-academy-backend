import type {
    EncryptedPayload 
} from "./encrypted-payload"

/** Params for encrypt (plaintext and key). */
export interface EncryptParams {
    /** The plaintext string to encrypt. */
    plainText: string
}

/** Result of encrypt (encrypted payload). */
export type EncryptResult = EncryptedPayload

/** Params for decrypt (payload and key). */
export interface DecryptParams {
    /** The encrypted payload (iv, ciphertext, authTag) to decrypt. */
    payload: EncryptedPayload
}

