/** Params for building an otpauth:// key URI for an authenticator app. */
export interface GenerateKeyUriParams {
    /** The base32-encoded shared secret. */
    secret: string
    /** Account label shown in the app (e.g. the user's email or username). */
    accountName: string
}

/** Params for verifying a user-supplied TOTP code against a secret. */
export interface VerifyTotpParams {
    /** The base32-encoded shared secret to check against. */
    secret: string
    /** The numeric code the user typed. */
    token: string
    /**
     * Optional override for the current time in milliseconds (defaults to
     * `Date.now()`). Used by tests to pin a deterministic time step.
     */
    timestampMs?: number
}
