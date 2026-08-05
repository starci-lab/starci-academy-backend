import {
    Injectable
} from "@nestjs/common"
import crypto from "crypto"
import {
    IV_LENGTH
} from "./constants"
import type {
    DecryptParams,
    DecryptResult,
    EncryptParams,
    EncryptResult
} from "./types"
import {
    MountStorageService
} from "@modules/filesystem"
import {
    DecryptionFailedException,
    InvalidIvLengthException,
} from "@modules/exceptions"

@Injectable()
/**
 * Service for AES-256-GCM encryption and decryption (authenticated encryption).
 *
 * @example
 * const payload = encryptionService.encrypt({ plainText, key })
 * const text = encryptionService.decrypt({ payload, key })
 */
export class EncryptionService {

    constructor(
        private readonly mountStorageService: MountStorageService,
    ) {}

    /**
     * Get the encryption key.
     * @returns The encryption key.
     */
    getEncryptionKey(): Buffer {
        return crypto.pbkdf2Sync(
            this.mountStorageService.encryptionKey.trim(),
            "starci-academy-backend:aes-256-gcm",
            100_000,
            32,
            "sha256",
        )
    }

    /**
     * Encrypts plaintext using AES-256-GCM (random IV per call, auth tag for integrity).
     *
     * @param param - Plaintext and key (Buffer)
     * @returns Encrypted payload (iv, ciphertext, authTag as Base64)
     *
     * @example
     * const payload = encryptionService.encrypt({ plainText: "secret", key })
     */
    encrypt(
        {
            plainText,
        }: EncryptParams
    ): EncryptResult {
        const iv = crypto.randomBytes(IV_LENGTH)

        const cipher = crypto.createCipheriv(
            "aes-256-gcm",
            this.getEncryptionKey(),
            iv
        )

        const encrypted = Buffer.concat([
            cipher.update(plainText,
                "utf8"),
            cipher.final(),
        ])
        const authTag = cipher.getAuthTag()

        return {
            iv: iv.toString("base64"),
            authTag: authTag.toString("base64"),
            ciphertext: encrypted.toString("base64"),
        }
    }

    /**
     * Decrypts AES-256-GCM payload; verifies integrity via auth tag (throws if tampered).
     *
     * @param param - Payload (iv, authTag, ciphertext) and key
     * @returns Decrypted plaintext
     *
     * @example
     * const text = encryptionService.decrypt({ payload, key })
     */
    decrypt({
        payload,
    }: DecryptParams): DecryptResult {
        const { iv, authTag, ciphertext } = payload

        const ivBuffer = Buffer.from(iv,
            "base64")
        // validated BEFORE the try block so a malformed IV surfaces as its own
        // typed exception instead of being swallowed into the generic decrypt
        // failure below
        if (ivBuffer.length !== IV_LENGTH) {
            throw new InvalidIvLengthException({
                actualLength: ivBuffer.length,
                expectedLength: IV_LENGTH,
            })
        }

        try {
            const authTagBuffer = Buffer.from(authTag,
                "base64")
            const encryptedBuffer = Buffer.from(ciphertext,
                "base64")

            const decipher = crypto.createDecipheriv("aes-256-gcm",
                this.getEncryptionKey(),
                ivBuffer)
            decipher.setAuthTag(authTagBuffer)

            const decryptedBuffer = Buffer.concat([
                decipher.update(encryptedBuffer),
                decipher.final(),
            ])
            return decryptedBuffer.toString("utf8")
        } catch (error) {
            // preserve the real crypto error via originalError — the previous
            // console.error + generic re-throw discarded it, hurting debuggability
            throw new DecryptionFailedException({
                originalError: error instanceof Error ? error : new Error(String(error)),
            })
        }
    }
}
