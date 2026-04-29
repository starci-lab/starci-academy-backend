import type {
    EncryptedPayload 
} from "./encrypted-payload"

/** Params for encrypt (plaintext and key). */
export interface EncryptParams {
    plainText: string
}

/** Result of encrypt (encrypted payload). */
export type EncryptResult = EncryptedPayload

/** Params for decrypt (payload and key). */
export interface DecryptParams {
    payload: EncryptedPayload
}

/** Result of decrypt (plaintext string). */
export type DecryptResult = string
