/**
 * Rotation-relevant classification of a failed AI call. Drives how the balancer
 * penalizes (or spares) the key that failed -- see `classifyAiError`.
 */
export enum AiErrorKind {
    /** Invalid / revoked / unauthorized key (401/403) -> hard-disable the key. */
    Auth = "auth",
    /** Rate limit / quota (429) -> short cooldown, key auto-recovers. */
    RateLimit = "rateLimit",
    /** 5xx / network / timeout / unknown -> light cooldown, try another key. */
    Transient = "transient",
    /** Prompt/content/abort fault, NOT the key -> do not penalize, stop retrying. */
    NonKey = "nonKey",
}
