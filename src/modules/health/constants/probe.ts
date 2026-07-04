/**
 * Per-probe wall-clock timeout (ms). A probe that neither resolves nor errors
 * within this budget is treated as `down` (timeout). Kept short so the public
 * status query stays snappy even when several components are unreachable.
 */
export const PROBE_TIMEOUT_MS = 2000

/**
 * Latency (ms) at or above which a reachable component is reported `degraded`
 * instead of `up`. A response slower than this still proves liveness but warns
 * that the component is struggling.
 */
export const PROBE_DEGRADED_THRESHOLD_MS = 1500

/**
 * How long (ms) the last full probe sweep is reused before a new one runs.
 * Lets the public status page poll (e.g. every 10s) without hammering infra —
 * back-to-back reads inside this window return the cached snapshot.
 */
export const PROBE_CACHE_TTL_MS = 5000

/**
 * How long (ms) an external-SaaS probe result is reused before re-probing.
 * Kept far above {@link PROBE_CACHE_TTL_MS} because these are public APIs with
 * their own rate limits — GitHub allows only ~60 unauthenticated requests per
 * hour per IP, so reusing the sweep-wide TTL would trip that limit (and falsely
 * report GitHub as down) under sustained polling of the public status query.
 */
export const EXTERNAL_PROBE_CACHE_TTL_MS = 120000
