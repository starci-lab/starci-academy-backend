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
 * Lets the public status page poll (e.g. every 10s) without hammering infra --
 * back-to-back reads inside this window return the cached snapshot.
 */
export const PROBE_CACHE_TTL_MS = 5000

/**
 * How long (ms) an external-SaaS probe result is reused before re-probing.
 * Kept far above {@link PROBE_CACHE_TTL_MS} because these are public APIs with
 * their own rate limits -- GitHub allows only ~60 unauthenticated requests per
 * hour per IP, so reusing the sweep-wide TTL would trip that limit (and falsely
 * report GitHub as down) under sustained polling of the public status query.
 */
export const EXTERNAL_PROBE_CACHE_TTL_MS = 120000

/**
 * How long (ms) the last Prometheus (cAdvisor) metrics sweep is reused before
 * re-querying. Slightly longer than {@link PROBE_CACHE_TTL_MS} since resource
 * usage is a 1-minute rate anyway -- refreshing faster than that buys nothing.
 */
export const CONTAINER_METRICS_CACHE_TTL_MS = 10000

/** Wall-clock timeout (ms) for a single Prometheus HTTP API query. */
export const PROMETHEUS_QUERY_TIMEOUT_MS = 2000

/**
 * Docker Compose container-name prefix every StarCi-owned service is given
 * (see `.docker/compose.yaml`, e.g. `starci-postgres`). Stripped from the
 * cAdvisor `name` label to land on the shared component key (`postgres`).
 */
export const CONTAINER_NAME_PREFIX = "starci-"

/**
 * cAdvisor's sentinel for "no memory limit set" -- the int64 max, reported as
 * `container_spec_memory_limit_bytes` when a container has no `mem_limit`.
 * Any value at or above this is treated as unbounded (`null`), not a real cap.
 */
export const UNBOUNDED_MEMORY_LIMIT_BYTES = 1e15
