import {
    Injectable,
    Logger,
} from "@nestjs/common"
import {
    Socket,
} from "net"
import {
    envConfig,
} from "@modules/env"
import {
    PROBE_TIMEOUT_MS,
    PROBE_DEGRADED_THRESHOLD_MS,
    PROBE_CACHE_TTL_MS,
} from "./constants"
import type {
    ComponentHealth,
    ComponentStatus,
    HttpProbeTarget,
    TcpProbeTarget,
} from "./types"

/**
 * Framework-light liveness prober for the platform's infrastructure
 * components. Instead of injecting the ten real clients (Postgres pool, Redis,
 * Kafka, …) it reaches each component directly using only the configured URL or
 * `host:port` — a raw `fetch` for HTTP services and a raw TCP socket for the
 * rest. Every probe is best-effort: the service NEVER throws, it reports `down`
 * with the error message instead.
 *
 * The last full sweep is cached in memory for {@link PROBE_CACHE_TTL_MS} so a
 * public status page polling every few seconds does not hammer infra.
 *
 * @example
 * const components = await systemHealthService.probeAll()
 */
@Injectable()
export class SystemHealthService {
    private readonly logger = new Logger(SystemHealthService.name)

    /** Last computed sweep, reused until {@link cachedAt} ages past the TTL. */
    private cached: Array<ComponentHealth> | null = null

    /** Epoch ms the cached sweep was produced (drives TTL expiry). */
    private cachedAt = 0

    /**
     * Returns the liveness of every infrastructure component, serving a cached
     * sweep when the previous one is still fresh.
     *
     * @returns One {@link ComponentHealth} per component, in probe order.
     *
     * @example
     * const components = await systemHealthService.probeAll()
     */
    async probeAll(): Promise<Array<ComponentHealth>> {
        // serve the in-memory snapshot while it is still inside the TTL window
        // so polling clients do not retrigger every infra probe each request
        if (this.cached && Date.now() - this.cachedAt < PROBE_CACHE_TTL_MS) {
            return this.cached
        }

        // resolve the configured endpoints once per sweep (cheap, pure reads)
        const httpTargets = this.resolveHttpTargets()
        const tcpTargets = this.resolveTcpTargets()

        // fire every probe concurrently; allSettled guarantees one slow/failing
        // probe never blocks or rejects the whole sweep
        const settled = await Promise.allSettled([
            ...httpTargets.map((target) => this.probeHttp(target)),
            ...tcpTargets.map((target) => this.probeTcp(target)),
        ])

        // each probe already swallows its own errors, so a rejected settlement
        // is an unexpected bug — fall back to a synthetic `down` to stay total
        const components = settled.map((outcome, index) => {
            // the probe resolved normally → use its ComponentHealth as-is
            if (outcome.status === "fulfilled") {
                return outcome.value
            }
            // defensive: name the component by its position in the probe list
            const name = this.probeNameByIndex({
                index,
                httpTargets,
                tcpTargets,
            })
            // log loudly because a thrown probe means a probe helper regressed
            this.logger.warn(`Health probe "${name}" rejected unexpectedly`)
            return this.downHealth({
                name,
                message: "probe failed unexpectedly",
                latencyMs: null,
            })
        })

        // memoize the fresh sweep + stamp the time so the TTL gate can expire it
        this.cached = components
        this.cachedAt = Date.now()
        return components
    }

    /**
     * Builds the list of HTTP probe targets from the runtime config. Any HTTP
     * response (even 401/4xx) proves the component is reachable, so these only
     * need a URL the component answers on.
     *
     * @returns One {@link HttpProbeTarget} per HTTP-reachable component.
     */
    private resolveHttpTargets(): Array<HttpProbeTarget> {
        const config = envConfig()
        return [
            // MinIO ships a dedicated unauthenticated liveness endpoint
            {
                name: "minio",
                url: `${config.s3.minio.endpoint}/minio/health/live`,
            },
            // Qdrant exposes a public `/healthz` readiness probe
            {
                name: "qdrant",
                url: `${config.databases.qdrant.url}/healthz`,
            },
            // Elasticsearch root requires auth → a 401 still proves reachability
            {
                name: "elasticsearch",
                url: config.elasticsearch.node,
            },
            // Keycloak realm endpoint answers without admin credentials
            {
                name: "keycloak",
                url: `${config.keycloak.url}/realms/${config.keycloak.realm}`,
            },
            // Judge0 `/about` returns version metadata with no auth token
            {
                name: "judge0",
                url: `${config.judge0.baseUrl}/about`,
            },
            // Ollama (OpenAI-compatible) lists models at `<baseUrl>/models`
            {
                name: "ollama",
                url: `${config.ai.local.baseUrl}/models`,
            },
        ]
    }

    /**
     * Builds the list of raw-TCP probe targets from the runtime config. These
     * components speak non-HTTP protocols, so liveness is a successful socket
     * connect rather than an HTTP response.
     *
     * @returns One {@link TcpProbeTarget} per TCP-reachable component.
     */
    private resolveTcpTargets(): Array<TcpProbeTarget> {
        const config = envConfig()
        // Kafka brokers are configured as "host:port" strings — split the first
        const [kafkaHost,
            kafkaPort] = this.splitHostPort(
            config.kafka.brokers[0],
        )
        return [
            // primary Postgres TCP listener
            {
                name: "postgres",
                host: config.databases.postgresql.primary.host,
                port: config.databases.postgresql.primary.port,
            },
            // cache Redis TCP listener
            {
                name: "redis",
                host: config.redis.cache.host,
                port: config.redis.cache.port,
            },
            // first configured NATS server
            {
                name: "nats",
                host: config.nats.servers[0].host,
                port: config.nats.servers[0].port,
            },
            // first Kafka broker, parsed from its "host:port" form
            {
                name: "kafka",
                host: kafkaHost,
                port: kafkaPort,
            },
        ]
    }

    /**
     * Probes one HTTP component. ANY response — including 4xx/401 — proves the
     * component is reachable and is reported `up` (or `degraded` when slow). A
     * thrown fetch (DNS/connection refused) or a 2s timeout is `down`.
     *
     * @param target - The component name + URL to fetch.
     * @returns The probed {@link ComponentHealth} (never throws).
     */
    private async probeHttp({
        name,
        url,
    }: HttpProbeTarget): Promise<ComponentHealth> {
        // measure round-trip latency around the fetch
        const startedAt = Date.now()
        try {
            // abort the request after the shared timeout budget so a hung
            // endpoint cannot stall the whole sweep
            await fetch(url,
                {
                    signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
                })
            // we intentionally ignore the status code: a response of any kind
            // (200, 401, 404…) means the socket + service are answering
            const latencyMs = Date.now() - startedAt
            return this.reachableHealth({
                name,
                latencyMs,
            })
        } catch (error) {
            // a thrown fetch means unreachable (refused/DNS) or timed out
            return this.downHealth({
                name,
                message: this.toMessage(error),
                latencyMs: null,
            })
        }
    }

    /**
     * Probes one TCP component by opening a raw socket. A successful `connect`
     * proves liveness; an `error` or a 2s `timeout` is reported `down`.
     *
     * @param target - The component name + host/port to connect to.
     * @returns The probed {@link ComponentHealth} (never throws).
     */
    private probeTcp({
        name,
        host,
        port,
    }: TcpProbeTarget): Promise<ComponentHealth> {
        // wrap the event-based socket in a promise that resolves exactly once
        return new Promise<ComponentHealth>((resolve) => {
            // measure round-trip latency around the connect attempt
            const startedAt = Date.now()
            const socket = new Socket()
            // guard so the first of connect/error/timeout wins and the rest are
            // ignored (the socket is always torn down on settle)
            let settled = false

            // tear down the socket and resolve once with the given health
            const finish = (health: ComponentHealth): void => {
                // ignore any later event after the first settle
                if (settled) {
                    return
                }
                settled = true
                // free the FD; destroy is safe to call regardless of state
                socket.destroy()
                resolve(health)
            }

            // cap the connect attempt at the shared timeout budget
            socket.setTimeout(PROBE_TIMEOUT_MS)

            // a completed TCP handshake proves the port is live
            socket.once("connect",
                () => {
                    const latencyMs = Date.now() - startedAt
                    finish(this.reachableHealth({
                        name,
                        latencyMs,
                    }))
                })

            // connection refused / host unreachable → down with the reason
            socket.once("error",
                (error) => {
                    finish(this.downHealth({
                        name,
                        message: this.toMessage(error),
                        latencyMs: null,
                    }))
                })

            // no handshake within the budget → down (timeout)
            socket.once("timeout",
                () => {
                    finish(this.downHealth({
                        name,
                        message: `connect timed out after ${PROBE_TIMEOUT_MS}ms`,
                        latencyMs: null,
                    }))
                })

            // kick off the connect (events above drive the outcome)
            socket.connect(port,
                host)
        })
    }

    /**
     * Maps a reachable component's latency onto an `up`/`degraded` health. Slow
     * but answering still proves liveness, so it is `degraded`, not `down`.
     *
     * @param params - Component name + measured latency.
     * @returns A `up`/`degraded` {@link ComponentHealth} with no message.
     */
    private reachableHealth({
        name,
        latencyMs,
    }: {
        /** Component name being reported. */
        name: string
        /** Measured probe latency in ms. */
        latencyMs: number
    }): ComponentHealth {
        // anything slower than the threshold is reachable-but-struggling
        const status: ComponentStatus =
            latencyMs > PROBE_DEGRADED_THRESHOLD_MS ? "degraded" : "up"
        return {
            name,
            status,
            latencyMs,
            message: null,
            checkedAt: new Date(),
        }
    }

    /**
     * Builds a `down` {@link ComponentHealth} for an unreachable component.
     *
     * @param params - Component name, failure message, optional latency.
     * @returns A `down` {@link ComponentHealth} stamped with the current time.
     */
    private downHealth({
        name,
        message,
        latencyMs,
    }: {
        /** Component name being reported. */
        name: string
        /** Short failure reason surfaced to the client. */
        message: string
        /** Latency if one was measured, else `null`. */
        latencyMs: number | null
    }): ComponentHealth {
        return {
            name,
            status: "down",
            latencyMs,
            message,
            checkedAt: new Date(),
        }
    }

    /**
     * Splits a `"host:port"` broker string into its parts, defaulting the port
     * to the Kafka standard 9092 when it is missing or non-numeric.
     *
     * @param hostPort - Broker endpoint in `host:port` form.
     * @returns A `[host, port]` tuple ready for a TCP probe.
     */
    private splitHostPort(hostPort: string): [string, number] {
        // separate on the LAST colon so IPv6-ish hosts degrade gracefully
        const lastColon = hostPort.lastIndexOf(":")
        // no colon → treat the whole value as the host on the default port
        if (lastColon === -1) {
            return [hostPort,
                9092]
        }
        // slice host + parse the trailing port, falling back when not a number
        const host = hostPort.slice(0,
            lastColon)
        const parsedPort = Number(hostPort.slice(lastColon + 1))
        return [host,
            Number.isFinite(parsedPort) ? parsedPort : 9092]
    }

    /**
     * Recovers the probe name for a settlement by its index in the combined
     * `[...http, ...tcp]` probe order — used only on the unexpected rejection
     * path where the resolved health (which carries the name) is unavailable.
     *
     * @param params - Settlement index + the two ordered target lists.
     * @returns The component name at that probe position.
     */
    private probeNameByIndex({
        index,
        httpTargets,
        tcpTargets,
    }: {
        /** Index of the settlement within the combined probe array. */
        index: number
        /** HTTP targets, which occupy the first slots of the probe array. */
        httpTargets: Array<HttpProbeTarget>
        /** TCP targets, which follow the HTTP targets in the probe array. */
        tcpTargets: Array<TcpProbeTarget>
    }): string {
        // HTTP probes are scheduled first, so an index inside their length
        // resolves directly to an HTTP target name
        if (index < httpTargets.length) {
            return httpTargets[index].name
        }
        // otherwise shift past the HTTP block to land on the TCP target
        return tcpTargets[index - httpTargets.length].name
    }

    /**
     * Normalizes an unknown caught value into a short, log-safe message string.
     *
     * @param error - The value thrown by `fetch`/socket.
     * @returns The error's message, or its stringified form as a fallback.
     */
    private toMessage(error: unknown): string {
        // prefer the real Error message; fall back to a string coercion so the
        // probe never crashes on a non-Error throw
        return error instanceof Error ? error.message : String(error)
    }
}
