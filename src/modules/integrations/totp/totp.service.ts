import {
    Injectable,
} from "@nestjs/common"
import crypto from "crypto"
import {
    TOTP_ALGORITHM,
    TOTP_DIGITS,
    TOTP_ISSUER,
    TOTP_PERIOD_SECONDS,
    TOTP_SECRET_BYTES,
    TOTP_VERIFY_WINDOW,
} from "./constants"
import type {
    GenerateKeyUriParams,
    VerifyTotpParams,
} from "./types"
import {
    base32Decode,
    base32Encode,
} from "./utils/base32"

@Injectable()
/**
 * RFC 6238 TOTP (time-based one-time password) helper -- secret generation,
 * otpauth URI building, and code verification with clock-skew tolerance.
 *
 * Self-contained (Node `crypto` only, no third-party OTP dependency) so it can
 * back an app-level second factor without coupling to Keycloak's OTP flow.
 *
 * @example
 * const secret = totpService.generateSecret()
 * const uri = totpService.generateKeyUri({ secret, accountName: "bob@acme.dev" })
 * const ok = totpService.verify({ secret, token: "123456" })
 */
export class TotpService {
    /**
     * Generate a fresh random base32 secret for a new enrollment.
     * @returns The base32-encoded shared secret.
     */
    generateSecret(): string {
        // 160 bits of entropy, encoded the way authenticator apps expect
        return base32Encode(crypto.randomBytes(TOTP_SECRET_BYTES))
    }

    /**
     * Build the otpauth:// URI an authenticator app reads (usually via QR).
     * @param params - The secret and the account label.
     * @returns The otpauth URI string.
     */
    generateKeyUri(
        {
            secret,
            accountName,
        }: GenerateKeyUriParams,
    ): string {
        // issuer-prefixed label keeps entries grouped + disambiguated in the app
        const label = encodeURIComponent(`${TOTP_ISSUER}:${accountName}`)
        const query = new URLSearchParams({
            secret,
            issuer: TOTP_ISSUER,
            algorithm: TOTP_ALGORITHM,
            digits: String(TOTP_DIGITS),
            period: String(TOTP_PERIOD_SECONDS),
        })
        return `otpauth://totp/${label}?${query.toString()}`
    }

    /**
     * Verify a user-supplied code against the secret, allowing ±window time
     * steps for clock skew.
     *
     * @param params - Secret, the typed token, and an optional time override.
     * @returns True when the token matches any code within the window.
     */
    verify(
        {
            secret,
            token,
            timestampMs,
        }: VerifyTotpParams,
    ): boolean {
        // strip spaces some apps insert ("123 456") before comparing
        const normalizedToken = token.replace(/\s+/g,
            "")
        // reject anything that is not exactly the expected number of digits
        if (!new RegExp(`^\\d{${TOTP_DIGITS}}$`).test(normalizedToken)) {
            return false
        }
        const secretBuffer = base32Decode(secret)
        // current time step index (RFC 6238: floor(unixSeconds / period))
        const now = timestampMs ?? Date.now()
        const counter = Math.floor(now / 1000 / TOTP_PERIOD_SECONDS)
        // accept the current step plus a window on each side for clock drift
        for (let offset = -TOTP_VERIFY_WINDOW; offset <= TOTP_VERIFY_WINDOW; offset++) {
            const candidate = this.generateForCounter(secretBuffer,
                counter + offset)
            // constant-time compare to avoid leaking match position via timing
            if (this.timingSafeEqual(candidate,
                normalizedToken)) {
                return true
            }
        }
        return false
    }

    /**
     * Compute the HOTP value for a specific counter (RFC 4226 dynamic truncation).
     * @param secretBuffer - The decoded secret bytes.
     * @param counter - The time-step counter.
     * @returns The zero-padded numeric code.
     */
    private generateForCounter(
        secretBuffer: Buffer,
        counter: number,
    ): string {
        // encode the counter as an 8-byte big-endian value
        const counterBuffer = Buffer.alloc(8)
        // write as two 32-bit halves to stay safe above 2^32
        counterBuffer.writeUInt32BE(Math.floor(counter / 0x1_0000_0000),
            0)
        counterBuffer.writeUInt32BE(counter >>> 0,
            4)
        // HMAC the counter under the shared secret
        const hmac = crypto
            .createHmac("sha1",
                secretBuffer)
            .update(counterBuffer)
            .digest()
        // dynamic truncation: low nibble of the last byte picks the 4-byte window
        const truncationOffset = hmac[hmac.length - 1] & 0x0f
        const binary =
            ((hmac[truncationOffset] & 0x7f) << 24)
            | ((hmac[truncationOffset + 1] & 0xff) << 16)
            | ((hmac[truncationOffset + 2] & 0xff) << 8)
            | (hmac[truncationOffset + 3] & 0xff)
        // reduce to the configured digit count and left-pad with zeros
        const code = binary % 10 ** TOTP_DIGITS
        return code.toString().padStart(TOTP_DIGITS,
            "0")
    }

    /**
     * Constant-time string comparison for equal-length digit codes.
     * @param expected - The server-computed code.
     * @param actual - The user-supplied code.
     * @returns True when the two are byte-equal.
     */
    private timingSafeEqual(
        expected: string,
        actual: string,
    ): boolean {
        const expectedBuffer = Buffer.from(expected)
        const actualBuffer = Buffer.from(actual)
        // timingSafeEqual throws on length mismatch -- guard first
        if (expectedBuffer.length !== actualBuffer.length) {
            return false
        }
        return crypto.timingSafeEqual(expectedBuffer,
            actualBuffer)
    }
}
