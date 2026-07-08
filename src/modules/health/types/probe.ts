/**
 * Liveness status of a single infrastructure component, as returned by the
 * {@link SystemHealthService}. Mirrors a traffic-light: reachable + fast is
 * `up`, reachable but slow is `degraded`, unreachable is `down`.
 */
export type ComponentStatus = "up" | "down" | "degraded"

/**
 * The result of probing one infrastructure component (Postgres, Redis, …).
 * Deliberately small + serializable so it can be cached in memory and mapped
 * straight onto the public GraphQL payload.
 */
export interface ComponentHealth {
    /** Stable component name (e.g. `postgres`, `redis`, `kafka`). */
    name: string
    /** Traffic-light status derived from reachability + latency. */
    status: ComponentStatus
    /** Round-trip latency of the probe in ms, or `null` when the probe threw. */
    latencyMs: number | null
    /** Short human-readable note — error message on failure, else `null`. */
    message: string | null
    /** Timestamp the probe completed (used by the client to show freshness). */
    checkedAt: Date
    /** cAdvisor-scraped container resource usage, or `null` when unavailable
     * (component has no local Docker container, or Prometheus is unreachable). */
    metrics: ContainerMetrics | null
}

/**
 * Live resource usage of one Docker container, scraped from cAdvisor via
 * Prometheus. Every field is a best-effort instant read — a missing metric
 * (container just started, cAdvisor scrape not landed yet) is `null` rather
 * than throwing.
 */
export interface ContainerMetrics {
    /** CPU usage as a percentage of one core (can exceed 100 on multi-core work). */
    cpuPercent: number | null
    /** Resident memory usage in bytes. */
    memoryUsedBytes: number | null
    /** Container memory limit in bytes, or `null` when unbounded. */
    memoryLimitBytes: number | null
    /** Network receive throughput in bytes/sec (1m rate). */
    networkRxBytesPerSec: number | null
    /** Network transmit throughput in bytes/sec (1m rate). */
    networkTxBytesPerSec: number | null
}

/**
 * Internal descriptor of one HTTP probe target — a name plus the URL to hit.
 * Any HTTP response (even 4xx/401) counts as reachable; only a thrown/timed-out
 * fetch is treated as down.
 */
export interface HttpProbeTarget {
    /** Stable component name reported back in {@link ComponentHealth.name}. */
    name: string
    /** Absolute URL the probe issues a `fetch` against. */
    url: string
}

/**
 * Internal descriptor of one TCP probe target — a name plus host/port. The
 * probe opens a raw socket and treats a successful `connect` as reachable.
 */
export interface TcpProbeTarget {
    /** Stable component name reported back in {@link ComponentHealth.name}. */
    name: string
    /** Hostname (or IP) the socket connects to. */
    host: string
    /** TCP port the socket connects to. */
    port: number
}

/**
 * A memoized external-SaaS probe result. Cached per component so a
 * rate-limited public API (GitHub) is not re-probed on every sweep.
 */
export interface ExternalProbeCacheEntry {
    /** The cached health result for the component. */
    result: ComponentHealth
    /** Epoch ms the result was produced (drives TTL expiry). */
    at: number
}
