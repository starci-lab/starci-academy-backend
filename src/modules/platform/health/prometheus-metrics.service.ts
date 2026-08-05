import {
    Injectable,
} from "@nestjs/common"
import {
    envConfig,
} from "@modules/env"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import {
    CONTAINER_METRICS_CACHE_TTL_MS,
    CONTAINER_NAME_PREFIX,
    PROMETHEUS_QUERY_TIMEOUT_MS,
    UNBOUNDED_MEMORY_LIMIT_BYTES,
} from "./constants"
import type {
    ContainerMetrics,
} from "./types"

/** Raw shape of a Prometheus instant-query response we actually read. */
interface PrometheusInstantQueryResponse {
    data?: {
        result?: Array<{
            metric?: Record<string, string>
            value?: [number, string]
        }>
    }
}

@Injectable()
/**
 * Reads live per-container CPU/memory/network usage from Prometheus (scraping
 * cAdvisor). Every StarCi-owned infra container is labelled `name=starci-<x>`
 * by cAdvisor (mirrors `docker ps --format {{.Names}}`), so a container's
 * metrics map onto the same `<x>` key used everywhere else in
 * {@link SystemHealthService} (e.g. `postgres`, `redis`).
 *
 * Best-effort: when Prometheus is unreachable (local dev without
 * `docker compose -f .docker/compose.yaml up`) every query resolves to an
 * empty map instead of throwing, so the public status page keeps rendering
 * liveness even without metrics.
 *
 * @example
 * const metrics = await prometheusMetricsService.containerMetricsByName()
 * metrics.get("postgres")?.cpuPercent
 */
export class PrometheusMetricsService {
    /** Last computed metrics sweep, reused until {@link cachedAt} ages past the TTL. */
    private cached: Map<string, ContainerMetrics> | null = null

    /** Epoch ms the cached sweep was produced (drives TTL expiry). */
    private cachedAt = 0

    constructor(
        private readonly winstonService: WinstonService,
    ) {}

    /**
     * Returns live resource usage for every StarCi-owned container Prometheus
     * currently knows about, keyed by the same component name used by
     * {@link SystemHealthService} (e.g. `postgres`, `not `starci-postgres`).
     *
     * @returns A map of component name -> {@link ContainerMetrics}. Components
     * with no local Docker container (Judge0, Ollama, mail, the AI balancer)
     * simply never appear in the map -- callers treat a missing key as `null`.
     */
    async containerMetricsByName(): Promise<Map<string, ContainerMetrics>> {
        if (this.cached && Date.now() - this.cachedAt < CONTAINER_METRICS_CACHE_TTL_MS) {
            return this.cached
        }

        const [cpuByName,
            memUsedByName,
            memLimitByName,
            netRxByName,
            netTxByName] = await Promise.all([
            this.runInstantQuery(
                "sum(rate(container_cpu_usage_seconds_total{name=~\"starci-.+\"}[1m])) by (name) * 100",
            ),
            this.runInstantQuery(
                "container_memory_usage_bytes{name=~\"starci-.+\"}",
            ),
            this.runInstantQuery(
                "container_spec_memory_limit_bytes{name=~\"starci-.+\"}",
            ),
            this.runInstantQuery(
                "sum(rate(container_network_receive_bytes_total{name=~\"starci-.+\"}[1m])) by (name)",
            ),
            this.runInstantQuery(
                "sum(rate(container_network_transmit_bytes_total{name=~\"starci-.+\"}[1m])) by (name)",
            ),
        ])

        // union of every container name that appeared in ANY of the 5 queries
        const containerNames = new Set([
            ...cpuByName.keys(),
            ...memUsedByName.keys(),
            ...memLimitByName.keys(),
            ...netRxByName.keys(),
            ...netTxByName.keys(),
        ])

        const metricsByComponent = new Map<string, ContainerMetrics>()
        for (const containerName of containerNames) {
            // strip the compose `starci-` prefix to land on the shared component key
            const componentName = containerName.startsWith(CONTAINER_NAME_PREFIX)
                ? containerName.slice(CONTAINER_NAME_PREFIX.length)
                : containerName
            const memoryLimitBytes = memLimitByName.get(containerName) ?? null
            metricsByComponent.set(componentName,
                {
                    cpuPercent: cpuByName.get(containerName) ?? null,
                    memoryUsedBytes: memUsedByName.get(containerName) ?? null,
                    // cAdvisor reports the int64 max as a sentinel for "no limit set"
                    memoryLimitBytes:
                        memoryLimitBytes && memoryLimitBytes < UNBOUNDED_MEMORY_LIMIT_BYTES
                            ? memoryLimitBytes
                            : null,
                    networkRxBytesPerSec: netRxByName.get(containerName) ?? null,
                    networkTxBytesPerSec: netTxByName.get(containerName) ?? null,
                })
        }

        this.cached = metricsByComponent
        this.cachedAt = Date.now()
        return metricsByComponent
    }

    /**
     * Runs one PromQL instant query and reduces the vector result to a
     * `{name label} -> value` map. Never throws -- Prometheus being down (or the
     * query itself failing) yields an empty map so the caller degrades to
     * "no metrics" instead of crashing the whole health sweep.
     *
     * @param promql - The PromQL expression to evaluate at "now".
     * @returns A map of the `name` label to the numeric sample value.
     */
    private async runInstantQuery(promql: string): Promise<Map<string, number>> {
        const result = new Map<string, number>()
        try {
            const { url } = envConfig().prometheus
            const response = await fetch(
                `${url}/api/v1/query?query=${encodeURIComponent(promql)}`,
                {
                    signal: AbortSignal.timeout(PROMETHEUS_QUERY_TIMEOUT_MS),
                },
            )
            if (!response.ok) {
                return result
            }
            const body = await response.json() as PrometheusInstantQueryResponse
            for (const sample of body.data?.result ?? []) {
                const name = sample.metric?.name
                const rawValue = sample.value?.[1]
                if (!name || rawValue === undefined) {
                    continue
                }
                const parsed = Number(rawValue)
                if (Number.isFinite(parsed)) {
                    result.set(name,
                        parsed)
                }
            }
        } catch (error) {
            // Prometheus unreachable/timed out -- log once at debug, degrade silently
            this.winstonService.log(WinstonLog.HealthProbeFailed,
                {
                    op: "health.prometheus.query-failed",
                    error: error instanceof Error ? error.message : String(error),
                })
        }
        return result
    }
}
