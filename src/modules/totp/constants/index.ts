/** Number of random bytes in a generated TOTP secret (160-bit, RFC 4226 §4). */
export const TOTP_SECRET_BYTES = 20

/** Number of digits in a generated one-time code. */
export const TOTP_DIGITS = 6

/** Time step (seconds) each code is valid for (RFC 6238 default). */
export const TOTP_PERIOD_SECONDS = 30

/** HMAC algorithm used to derive codes (authenticator-app default). */
export const TOTP_ALGORITHM = "SHA1"

/**
 * Number of time steps to check on each side of "now" when verifying, to absorb
 * client/server clock skew (±1 step = ±30s).
 */
export const TOTP_VERIFY_WINDOW = 1

/** Issuer label embedded in the otpauth URI (shown in authenticator apps). */
export const TOTP_ISSUER = "StarCi Academy"
