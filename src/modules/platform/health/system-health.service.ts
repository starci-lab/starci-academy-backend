import {
    Injectable,
} from "@nestjs/common"
import {
    Socket,
} from "net"
import {
    createTransport,
} from "nodemailer"
import {
    envConfig,
} from "@modules/platform/env/config"
import {
    getBrevoSmtpPassword,
} from "@modules/filesystem/utils/mount-secrets"
import {
    AiBalancerService,
} from "@modules/ai/balancer/ai-balancer.service"
import {
    WinstonLog,
} from "@modules/platform/winston/enums/winston-log"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    PrometheusMetricsService,
} from "./prometheus-metrics.service"
import {
    PROBE_TIMEOUT_MS,
    PROBE_DEGRADED_THRESHOLD_MS,
    PROBE_CACHE_TTL_MS,
    EXTERNAL_PROBE_CACHE_TTL_MS,
} from "./constants/probe"
import type {
    ComponentHealth,
    ComponentStatus,
    DownHealthParams,
    ExternalProbeCacheEntry,
    HttpProbeTarget,
    ReachableHealthParams,
    TcpProbeTarget,
} from "./types/probe"

@Injectable()
/**
 * Framework-light liveness prober for the platform's infrastructure
 * components. Instead of injecting the real clients (Postgres pool, Redis,
 * Kafka, ...) it reaches each component directly using only the configured URL or
 * `host:port` -- a raw `fetch` for HTTP services and a raw TCP socket for the
 * rest -- plus two special cases: an SMTP `verify()` for mail, and an in-process
 * key-pool read for the AI Balancer. Every probe is best-effort: the service
 * NEVER throws, it reports `down` with the error message instead.
 *
 * The last full sweep is cached in memory for {@link PROBE_CACHE_TTL_MS} so a
 * public status page polling every few seconds does not hammer infra. External
 * SaaS targets (GitHub, payment gateways) get a second, much longer
 * {@link EXTERNAL_PROBE_CACHE_TTL_MS} cache on top, since they are rate-limited
 * public APIs the sweep-wide TTL alone would not protect.
 *
 * @example
 * const components = await systemHealthService.probeAll()
 */
export class SystemHealthService {
    constructor(
        private readonly aiBalancerService: AiBalancerService,
        private readonly prometheusMetricsService: PrometheusMetricsService,
        private readonly winstonService: WinstonService,
    ) {}

    /** Last computed sweep, reused until {@link cachedAt} ages past the TTL. */
    private cached: Array<ComponentHealth> | null = null

    /** Epoch ms the cached sweep was produced (drives TTL expiry). */
    private cachedAt = 0

    /** Per-component memoized external-SaaS results (rate-limit guard). */
    private readonly externalCache = new Map<string, ExternalProbeCacheEntry>()

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
        const externalTargets = this.resolveExternalHttpTargets()

        // one flat, ordered descriptor per probe this sweep runs -- lets every
        // probe fire concurrently while still recovering a name-by-index on
        // the (unexpected) rejection path below, without positional math
        // across several differently-shaped target lists
        const descriptors: Array<{
            /** Component name reported in {@link ComponentHealth.name}. */
            name: string
            /** Runs this component's probe (never throws). */
            run: () => Promise<ComponentHealth>
        }> = [
            ...httpTargets.map((target) => ({
                name: target.name,
                run: () => this.probeHttp(target),
            })),
            ...tcpTargets.map((target) => ({
                name: target.name,
                run: () => this.probeTcp(target),
            })),
            {
                name: "mail",
                run: () => this.probeMail(),
            },
            {
                name: "aiBalancer",
                run: () => this.probeAiBalancer(),
            },
            ...externalTargets.map((target) => ({
                name: target.name,
                run: () => this.probeExternalHttp(target),
            })),
        ]

        // fire every liveness probe + the Prometheus metrics sweep concurrently;
        // allSettled guarantees one slow/failing probe never blocks or rejects
        // the whole sweep, and metrics degrade to an empty map on their own
        const [settled,
            metricsByComponent] = await Promise.all([
            Promise.allSettled(
                descriptors.map((descriptor) => descriptor.run()),
            ),
            this.prometheusMetricsService.containerMetricsByName(),
        ])

        // each probe already swallows its own errors, so a rejected settlement
        // is an unexpected bug -- fall back to a synthetic `down` to stay total
        const components = settled.map((outcome, index) => {
            // the probe resolved normally -> use its ComponentHealth as-is,
            // topped up with live cAdvisor metrics when this component has one
            if (outcome.status === "fulfilled") {
                return {
                    ...outcome.value,
                    metrics: metricsByComponent.get(outcome.value.name) ?? null,
                }
            }
            // defensive: the descriptor at this index carries its own name
            const { name } = descriptors[index]
            // log loudly because a thrown probe means a probe helper regressed
            this.winstonService.log(WinstonLog.HealthProbeFailed,
                {
                    op: "health.probe.rejected",
                    meta: {
                        name,
                    },
                })
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
            // Elasticsearch root requires auth -> a 401 still proves reachability
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
        // Kafka brokers are configured as "host:port" strings -- split the first
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
     * Builds the list of external SaaS the platform integrates with over
     * plain REST (GitHub, plus the payment gateways). Any HTTP response proves
     * reachability, same as {@link resolveHttpTargets}; these are probed
     * separately so {@link probeExternalHttp} can apply its own, much longer
     * cache TTL and stay under each provider's rate limit.
     *
     * @returns One {@link HttpProbeTarget} per integrated external service.
     */
    private resolveExternalHttpTargets(): Array<HttpProbeTarget> {
        const config = envConfig()
        return [
            // GitHub REST API (OAuth + repo/team management) -- fixed public host
            {
                name: "github",
                url: "https://api.github.com",
            },
            // Stripe API (international cards) -- SDK's fixed base host
            {
                name: "stripe",
                url: "https://api.stripe.com",
            },
            // PayPal API -- env-driven so sandbox vs live is probed correctly
            {
                name: "paypal",
                url: config.services.api.paypal.baseUrl,
            },
            // PayOS merchant API (domestic gateway) -- fixed public host
            {
                name: "payos",
                url: "https://api-merchant.payos.vn",
            },
            // SePay gateway API (domestic gateway) -- fixed public host
            {
                name: "sepay",
                url: "https://my.sepay.vn",
            },
        ]
    }

    /**
     * Probes one HTTP component. ANY response -- including 4xx/401 -- proves the
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
            // (200, 401, 404...) means the socket + service are answering
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

            // connection refused / host unreachable -> down with the reason
            socket.once("error",
                (error) => {
                    finish(this.downHealth({
                        name,
                        message: this.toMessage(error),
                        latencyMs: null,
                    }))
                })

            // no handshake within the budget -> down (timeout)
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
     * Probes the transactional-mail service (Brevo SMTP). Opens a throwaway
     * transporter mirroring the app's real Brevo config and runs `verify()` --
     * which connects, EHLOs, and authenticates against the SMTP server,
     * proving mail can actually be sent (host + port + credentials), not just
     * that the port is reachable. The transporter is always closed after.
     *
     * @returns The probed {@link ComponentHealth} (never throws).
     */
    private async probeMail(): Promise<ComponentHealth> {
        // read the same Brevo SMTP config + secret the real mailer uses
        const {
            host,
            port,
            secure,
            username,
        } = envConfig().services.brevo
        // a short-lived, non-pooled transporter dedicated to this probe
        const transporter = createTransport({
            host,
            port,
            secure,
            auth: {
                user: username,
                pass: getBrevoSmtpPassword().trim(),
            },
        })
        // latency clock around the SMTP handshake
        const startedAt = Date.now()
        try {
            // verify connects + authenticates -- the real "can we send mail" check
            await transporter.verify()
            const latencyMs = Date.now() - startedAt
            return this.reachableHealth({
                name: "mail",
                latencyMs,
            })
        } catch (error) {
            // SMTP unreachable / auth rejected -> down with the reason
            return this.downHealth({
                name: "mail",
                message: this.toMessage(error),
                latencyMs: null,
            })
        } finally {
            // always release the SMTP connection pool for this throwaway transporter
            transporter.close()
        }
    }

    /**
     * Probes the in-process AI Balancer -- a first-class component even though
     * it never leaves the process. Its liveness is its key pool: at least one
     * active provider key is `up`, some keys disabled but others alive is
     * `degraded`, zero active keys across every provider is `down` (the app
     * can no longer route any AI call).
     *
     * @returns The probed {@link ComponentHealth} (never throws).
     */
    private async probeAiBalancer(): Promise<ComponentHealth> {
        try {
            // read the in-memory key-pool snapshot (merges mount keys + ping cache)
            const snapshot = await this.aiBalancerService.healthSnapshot()
            // total live keys = the routable capacity; zero means no AI call can go out
            const activeKeys = snapshot.providers.reduce(
                (sum, provider) => sum + provider.activeKeys,
                0,
            )
            // total disabled keys = degraded capacity even when some remain alive
            const disabledKeys = snapshot.providers.reduce(
                (sum, provider) => sum + provider.disabledKeys,
                0,
            )
            // no key alive anywhere -> the balancer cannot serve -> down
            if (activeKeys === 0) {
                return this.downHealth({
                    name: "aiBalancer",
                    message: "no active AI keys",
                    latencyMs: null,
                })
            }
            // some keys disabled but capacity remains -> degraded; otherwise fully up
            return {
                name: "aiBalancer",
                status: disabledKeys > 0 ? "degraded" : "up",
                latencyMs: null,
                message: null,
                checkedAt: new Date(),
                // in-process, no Docker container to scrape metrics from
                metrics: null,
            }
        } catch (error) {
            // snapshot read failed -> down with the reason
            return this.downHealth({
                name: "aiBalancer",
                message: this.toMessage(error),
                latencyMs: null,
            })
        }
    }

    /**
     * Probes one external SaaS component, serving a fresh-enough cached
     * result when available. Wraps {@link probeHttp} (same "any response
     * proves reachability" semantics) with a much longer, per-component TTL
     * so a frequently-polled public status query never trips a provider's
     * rate limit (notably GitHub's 60/hour unauthenticated cap).
     *
     * @param target - The component name + URL to probe.
     * @returns The probed {@link ComponentHealth} (never throws).
     */
    private async probeExternalHttp(target: HttpProbeTarget): Promise<ComponentHealth> {
        // reuse a recent result to stay under the provider's rate limit
        const cached = this.externalCache.get(target.name)
        if (cached && Date.now() - cached.at < EXTERNAL_PROBE_CACHE_TTL_MS) {
            return cached.result
        }
        const result = await this.probeHttp(target)
        // memoize for the TTL window so the next sweep reuses it
        this.externalCache.set(target.name,
            {
                result,
                at: Date.now(),
            })
        return result
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
    }: ReachableHealthParams): ComponentHealth {
        // anything slower than the threshold is reachable-but-struggling
        const status: ComponentStatus =
            latencyMs > PROBE_DEGRADED_THRESHOLD_MS ? "degraded" : "up"
        return {
            name,
            status,
            latencyMs,
            message: null,
            checkedAt: new Date(),
            // filled in by the caller (probeAll) once the metrics sweep resolves
            metrics: null,
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
    }: DownHealthParams): ComponentHealth {
        return {
            name,
            status: "down",
            latencyMs,
            message,
            checkedAt: new Date(),
            // a down component has no meaningful resource usage to report
            metrics: null,
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
        // no colon -> treat the whole value as the host on the default port
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
