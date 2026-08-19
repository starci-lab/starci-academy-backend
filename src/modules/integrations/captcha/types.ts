/** Params for verifying a captcha token server-side. */
export interface VerifyCaptchaParams {
    /** The Turnstile token supplied by the client widget. */
    token: string
    /** Best-effort client IP forwarded to Cloudflare for additional checks. */
    remoteIp?: string | null
}

/** Shape of Cloudflare Turnstile's siteverify JSON response (subset). */
export interface TurnstileVerifyResponse {
    /** Whether the token passed verification. */
    success: boolean
    /** Machine-readable error codes when verification fails. */
    "error-codes"?: Array<string>
    /** Timestamp (ISO) of the challenge, when present. */
    challenge_ts?: string
    /** Hostname the challenge was solved on, when present. */
    hostname?: string
}
