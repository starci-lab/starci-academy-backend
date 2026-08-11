/**
 * Redis key prefix for the short-lived cache holding the result of a refresh
 * exchange, keyed by the SHA-256 fingerprint of the incoming refresh token.
 */
export const REFRESH_RESULT_KEY_PREFIX = "kc:refresh:result:"

/**
 * Redis key prefix for the single-flight lock that elects one caller to hit
 * Keycloak per distinct refresh token.
 */
export const REFRESH_LOCK_KEY_PREFIX = "kc:refresh:lock:"

/**
 * Lock lifetime (ms). Must comfortably exceed a Keycloak token round-trip so
 * the lock never expires mid-exchange, yet stay short enough that a crashed
 * holder is recovered quickly.
 */
export const REFRESH_LOCK_TTL_MS = 5_000

/**
 * Lifetime (ms) of a cached exchange result. Spans the burst window in which a
 * client fires several refreshes before it has stored the rotated token, so
 * every concurrent/near-concurrent call receives the same fresh pair.
 */
export const REFRESH_RESULT_TTL_MS = 30_000

/**
 * Maximum time (ms) a coalesced caller waits for the lock holder's result
 * before failing closed. A waiter never bypasses the Redis election because
 * rotating the same refresh token twice would invalidate one of the callers.
 */
export const REFRESH_WAIT_TIMEOUT_MS = 5_000

/**
 * Interval (ms) between polls while waiting for the lock holder's result.
 */
export const REFRESH_POLL_INTERVAL_MS = 50
