/**
 * The request header through which the client echoes back the CSRF token
 * (the double-submit counterpart of the `csrf_token` cookie).
 */
export const CSRF_HEADER_NAME = "x-csrf-token"

/**
 * Separator between the random payload and its HMAC signature inside a
 * CSRF token string (`<payload>.<signature>`).
 */
export const CSRF_TOKEN_SEPARATOR = "."

/**
 * Number of random bytes in the CSRF token payload before signing.
 * 32 bytes (256 bits) is well beyond brute-force reach.
 */
export const CSRF_PAYLOAD_BYTES = 32
