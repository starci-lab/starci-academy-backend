import type {
    AiBalancerService,
} from "@modules/ai/balancer/ai-balancer.service"
import type {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    WinstonLog,
} from "@modules/platform/winston/enums/winston-log"
import {
    envConfig,
} from "@modules/platform/env/config"
import {
    getBrevoSmtpPassword,
} from "@modules/filesystem/utils/mount-secrets"
import {
    createTransport,
} from "nodemailer"
import {
    SystemHealthService,
} from "./system-health.service"
import type {
    PrometheusMetricsService,
} from "./prometheus-metrics.service"
import type {
    ComponentHealth,
    ContainerMetrics,
} from "./types/probe"

/** One socket event the fake `net.Socket` can be driven to emit. */
type SocketEvent = "connect" | "error" | "timeout"

/** The subset of `net.Socket` the prober actually drives. */
interface FakeSocketLike {
    /** Handlers registered through `once`, keyed by event name. */
    handlers: Record<string, (payload?: unknown) => void>
    /** Fire one registered handler, if the prober registered it. */
    emit: (event: SocketEvent, payload?: unknown) => void
}

/** Mutable state shared with the hoisted `net` mock factory. */
const mockSocket: {
    /** `[port, host]` pairs every constructed socket was asked to connect to. */
    connects: Array<{ port: number, host: string }>
    /** Every `setTimeout` budget the prober applied. */
    timeouts: Array<number>
    /** How many times a socket was destroyed (one per settle). */
    destroyed: number
    /** Drives the outcome of each connect attempt (set per test). */
    drive: (socket: FakeSocketLike, host: string) => void
} = {
    connects: [],
    timeouts: [],
    destroyed: 0,
    drive: (socket) => socket.emit("connect"),
}

/** Current epoch-ms the whole suite reads through a stubbed `Date.now`. */
let mockNow = 1_700_000_000_000

/** Move the suite clock forward (used to age caches and to fake probe latency). */
const advance = (ms: number): void => {
    mockNow += ms
}

jest.mock("net",
    () => {
        const actual = jest.requireActual("net")
        class FakeSocket {
            /** Handlers the prober registered through `once`. */
            public handlers: Record<string, (payload?: unknown) => void> = {
            }

            /** Last host this socket was pointed at (drives per-target behaviour). */
            private host = ""

            /** Record the applied timeout budget. */
            public setTimeout(ms: number): void {
                mockSocket.timeouts.push(ms)
            }

            /** Register a one-shot handler, mirroring `net.Socket#once`. */
            public once(event: string, handler: (payload?: unknown) => void): FakeSocket {
                this.handlers[event] = handler
                return this
            }

            /** Count teardown so the "settles exactly once" guard can be asserted. */
            public destroy(): void {
                mockSocket.destroyed += 1
            }

            /** Invoke a registered handler if the prober asked for that event. */
            public emit(event: SocketEvent, payload?: unknown): void {
                this.handlers[event]?.(payload)
            }

            /** Record the attempt, then let the test's driver decide the outcome. */
            public connect(port: number, host: string): void {
                this.host = host
                mockSocket.connects.push({
                    port,
                    host,
                })
                mockSocket.drive(this,
                    this.host)
            }
        }
        return {
            ...actual,
            Socket: FakeSocket,
        }
    })

jest.mock("nodemailer",
    () => ({
        createTransport: jest.fn(),
    }))

// The prober only needs this class as a DI token; importing it for real drags in
// the cache/key-store chain, which reads envConfig() at module scope.
jest.mock("@modules/ai/balancer/ai-balancer.service",
    () => ({
        AiBalancerService: class {
        },
    }))

jest.mock("@modules/platform/env/config",
    () => ({
        envConfig: jest.fn(),
    }))

jest.mock("@modules/filesystem/utils/mount-secrets",
    () => ({
        getBrevoSmtpPassword: jest.fn(),
    }))

/** The runtime config the prober resolves every probe target from. */
const testConfig = {
    s3: {
        minio: {
            endpoint: "http://minio:9000",
        },
    },
    databases: {
        qdrant: {
            url: "http://qdrant:6333",
        },
        postgresql: {
            primary: {
                host: "postgres",
                port: 5432,
            },
        },
    },
    elasticsearch: {
        node: "http://elasticsearch:9200",
    },
    keycloak: {
        url: "http://keycloak:8089",
        realm: "starci",
    },
    judge0: {
        baseUrl: "http://judge0:2358",
    },
    ai: {
        local: {
            baseUrl: "http://ollama:11434/v1",
        },
    },
    redis: {
        cache: {
            host: "redis",
            port: 6379,
        },
    },
    nats: {
        servers: [
            {
                host: "nats",
                port: 4222,
            },
        ],
    },
    kafka: {
        brokers: [
            "kafka:9094",
        ],
    },
    services: {
        api: {
            paypal: {
                baseUrl: "https://api-m.sandbox.paypal.com",
            },
        },
        brevo: {
            host: "smtp-relay.brevo.com",
            port: 587,
            secure: false,
            username: "brevo-user",
        },
    },
}

/** Every component name the sweep reports, in probe order. */
const ALL_COMPONENTS = [
    "minio",
    "qdrant",
    "elasticsearch",
    "keycloak",
    "judge0",
    "ollama",
    "postgres",
    "redis",
    "nats",
    "kafka",
    "mail",
    "aiBalancer",
    "github",
    "stripe",
    "paypal",
    "payos",
    "sepay",
]

/** The five external SaaS targets, which carry their own longer cache. */
const EXTERNAL_URLS = [
    "https://api.github.com",
    "https://api.stripe.com",
    "https://api-m.sandbox.paypal.com",
    "https://api-merchant.payos.vn",
    "https://my.sepay.vn",
]

describe("SystemHealthService",
    () => {
        let aiBalancerService: { healthSnapshot: jest.Mock }
        let prometheusMetricsService: { containerMetricsByName: jest.Mock }
        let winstonService: { log: jest.Mock }
        let fetchMock: jest.Mock
        let verifyMock: jest.Mock
        let closeMock: jest.Mock
        let service: SystemHealthService

        /** Build a fully-populated container-metrics row for the merge assertions. */
        const metricsRow = (cpuPercent: number): ContainerMetrics => ({
            cpuPercent,
            memoryUsedBytes: 1024,
            memoryLimitBytes: 4096,
            networkRxBytesPerSec: 10,
            networkTxBytesPerSec: 20,
        })

        /** Look one component out of a finished sweep. */
        const byName = (
            components: Array<ComponentHealth>,
            name: string,
        ): ComponentHealth => {
            const found = components.find((component) => component.name === name)
            if (!found) {
                throw new Error(`component ${name} missing from the sweep`)
            }
            return found
        }

        beforeEach(() => {
            jest.clearAllMocks()
            mockNow = 1_700_000_000_000
            mockSocket.connects = []
            mockSocket.timeouts = []
            mockSocket.destroyed = 0
            mockSocket.drive = (socket) => socket.emit("connect")

            jest.spyOn(Date,
                "now").mockImplementation(() => mockNow)
            // AbortSignal.timeout would leave a real 2s timer behind on every probe
            jest.spyOn(AbortSignal,
                "timeout").mockImplementation(() => new AbortController().signal);

            (envConfig as jest.Mock).mockReturnValue(testConfig);
            (getBrevoSmtpPassword as jest.Mock).mockReturnValue("  smtp-secret  ")

            verifyMock = jest.fn().mockResolvedValue(true)
            closeMock = jest.fn();
            (createTransport as jest.Mock).mockReturnValue({
                verify: verifyMock,
                close: closeMock,
            })

            fetchMock = jest.fn().mockResolvedValue({
                status: 200,
            })
            globalThis.fetch = fetchMock as unknown as typeof fetch

            aiBalancerService = {
                healthSnapshot: jest.fn().mockResolvedValue({
                    providers: [
                        {
                            activeKeys: 3,
                            disabledKeys: 0,
                        },
                        {
                            activeKeys: 1,
                            disabledKeys: 0,
                        },
                    ],
                }),
            }
            prometheusMetricsService = {
                containerMetricsByName: jest.fn().mockResolvedValue(new Map()),
            }
            winstonService = {
                log: jest.fn(),
            }

            service = new SystemHealthService(
                aiBalancerService as unknown as AiBalancerService,
                prometheusMetricsService as unknown as PrometheusMetricsService,
                winstonService as unknown as WinstonService,
            )
        })

        afterEach(() => {
            jest.restoreAllMocks()
        })

        describe("probeAll",
            () => {
                it("reports every configured component up, in probe order, on a healthy sweep",
                    async () => {
                        const components = await service.probeAll()

                        expect(components.map((component) => component.name)).toEqual(ALL_COMPONENTS)
                        expect(components.every((component) => component.status === "up")).toBe(true)
                        expect(components.every((component) => component.message === null)).toBe(true)
                        // 6 internal HTTP targets + 5 external SaaS targets
                        expect(fetchMock).toHaveBeenCalledTimes(11)
                        expect(winstonService.log).not.toHaveBeenCalled()
                    })

                it("resolves each HTTP probe URL from the runtime config and applies the timeout budget",
                    async () => {
                        await service.probeAll()

                        const urls = fetchMock.mock.calls.map((call: Array<unknown>) => call[0])
                        expect(urls).toEqual([
                            "http://minio:9000/minio/health/live",
                            "http://qdrant:6333/healthz",
                            "http://elasticsearch:9200",
                            "http://keycloak:8089/realms/starci",
                            "http://judge0:2358/about",
                            "http://ollama:11434/v1/models",
                            ...EXTERNAL_URLS,
                        ])
                        expect(AbortSignal.timeout).toHaveBeenCalledWith(2000)
                    })

                it("opens one socket per TCP target, splitting the kafka broker into host and port",
                    async () => {
                        await service.probeAll()

                        expect(mockSocket.connects).toEqual([
                            {
                                port: 5432,
                                host: "postgres",
                            },
                            {
                                port: 6379,
                                host: "redis",
                            },
                            {
                                port: 4222,
                                host: "nats",
                            },
                            {
                                port: 9094,
                                host: "kafka",
                            },
                        ])
                        expect(mockSocket.timeouts).toEqual([
                            2000,
                            2000,
                            2000,
                            2000,
                        ])
                        // every socket settled exactly once and was torn down
                        expect(mockSocket.destroyed).toBe(4)
                    })

                it("merges live container metrics onto the components that have them",
                    async () => {
                        prometheusMetricsService.containerMetricsByName.mockResolvedValue(
                            new Map([
                                [
                                    "postgres",
                                    metricsRow(12.5),
                                ],
                            ]),
                        )

                        const components = await service.probeAll()

                        expect(byName(components,
                            "postgres").metrics).toEqual(metricsRow(12.5))
                        // a component with no scraped container reports null, not undefined
                        expect(byName(components,
                            "redis").metrics).toBeNull()
                    })

                it("serves the cached sweep inside the TTL, then re-probes once it expires",
                    async () => {
                        const first = await service.probeAll()
                        advance(4_999)
                        const second = await service.probeAll()

                        // the identical array instance is handed back -- no new probing
                        expect(second).toBe(first)
                        expect(fetchMock).toHaveBeenCalledTimes(11)
                        expect(mockSocket.connects).toHaveLength(4)

                        advance(2)
                        const third = await service.probeAll()

                        expect(third).not.toBe(first)
                        // the 4 TCP probes ran again; the 5 external URLs stayed cached
                        expect(mockSocket.connects).toHaveLength(8)
                        expect(fetchMock).toHaveBeenCalledTimes(17)
                    })

                it("falls back to a synthetic down entry and logs when a probe helper throws outright",
                    async () => {
                        // createTransport runs outside probeMail's try/catch, so a throw here
                        // escapes the probe and rejects its settlement
                        (createTransport as jest.Mock).mockImplementation(() => {
                            throw new Error("transport blew up")
                        })

                        const components = await service.probeAll()

                        expect(byName(components,
                            "mail")).toMatchObject({
                            name: "mail",
                            status: "down",
                            message: "probe failed unexpectedly",
                            latencyMs: null,
                        })
                        expect(winstonService.log).toHaveBeenCalledWith(
                            WinstonLog.HealthProbeFailed,
                            {
                                op: "health.probe.rejected",
                                meta: {
                                    name: "mail",
                                },
                            },
                        )
                        // the rest of the sweep is unaffected
                        expect(byName(components,
                            "postgres").status).toBe("up")
                    })
            })

        describe("HTTP probes",
            () => {
                it("reports a slow but answering endpoint as degraded rather than down",
                    async () => {
                        fetchMock.mockImplementation(async (url: string) => {
                            // only MinIO is slow; 1501ms clears the degraded threshold
                            advance(url.includes("minio") ? 1_501 : 0)
                            return {
                                status: 200,
                            }
                        })

                        const components = await service.probeAll()

                        expect(byName(components,
                            "minio")).toMatchObject({
                            status: "degraded",
                            latencyMs: 1_501,
                            message: null,
                        })
                        expect(byName(components,
                            "qdrant").status).toBe("up")
                    })

                it("treats a latency exactly at the degraded threshold as still up",
                    async () => {
                        fetchMock.mockImplementation(async (url: string) => {
                            advance(url.includes("qdrant") ? 1_500 : 0)
                            return {
                                status: 200,
                            }
                        })

                        const components = await service.probeAll()

                        expect(byName(components,
                            "qdrant")).toMatchObject({
                            status: "up",
                            latencyMs: 1_500,
                        })
                    })

                it("reports a refused or timed-out fetch as down, carrying the error message",
                    async () => {
                        fetchMock.mockImplementation(async (url: string) => {
                            if (url.includes("judge0")) {
                                throw new Error("connect ECONNREFUSED")
                            }
                            return {
                                status: 200,
                            }
                        })

                        const components = await service.probeAll()

                        expect(byName(components,
                            "judge0")).toMatchObject({
                            status: "down",
                            latencyMs: null,
                            message: "connect ECONNREFUSED",
                        })
                    })

                it("stringifies a non-Error rejection instead of crashing the sweep",
                    async () => {
                        fetchMock.mockImplementation(async (url: string) => {
                            if (url.includes("elasticsearch")) {
                                // a bare string rejection, not an Error instance
                                return Promise.reject("socket hang up")
                            }
                            return {
                                status: 200,
                            }
                        })

                        const components = await service.probeAll()

                        expect(byName(components,
                            "elasticsearch")).toMatchObject({
                            status: "down",
                            message: "socket hang up",
                        })
                    })
            })

        describe("TCP probes",
            () => {
                it("reports a completed handshake as up and measures its latency",
                    async () => {
                        mockSocket.drive = (socket, host) => {
                            advance(host === "redis" ? 7 : 1)
                            socket.emit("connect")
                        }

                        const components = await service.probeAll()

                        expect(byName(components,
                            "redis")).toMatchObject({
                            status: "up",
                            latencyMs: 7,
                            message: null,
                        })
                    })

                it("reports a slow handshake as degraded",
                    async () => {
                        mockSocket.drive = (socket, host) => {
                            advance(host === "nats" ? 1_600 : 1)
                            socket.emit("connect")
                        }

                        const components = await service.probeAll()

                        expect(byName(components,
                            "nats")).toMatchObject({
                            status: "degraded",
                            latencyMs: 1_600,
                        })
                    })

                it("reports a socket error as down with the underlying reason",
                    async () => {
                        mockSocket.drive = (socket, host) => {
                            if (host === "postgres") {
                                socket.emit("error",
                                    new Error("ECONNREFUSED 5432"))
                                return
                            }
                            socket.emit("connect")
                        }

                        const components = await service.probeAll()

                        expect(byName(components,
                            "postgres")).toMatchObject({
                            status: "down",
                            latencyMs: null,
                            message: "ECONNREFUSED 5432",
                        })
                    })

                it("reports a handshake that never lands as down, naming the timeout budget",
                    async () => {
                        mockSocket.drive = (socket, host) => {
                            if (host === "kafka") {
                                socket.emit("timeout")
                                return
                            }
                            socket.emit("connect")
                        }

                        const components = await service.probeAll()

                        expect(byName(components,
                            "kafka")).toMatchObject({
                            status: "down",
                            latencyMs: null,
                            message: "connect timed out after 2000ms",
                        })
                    })

                it("settles on the first event only, ignoring a late error after a successful connect",
                    async () => {
                        mockSocket.drive = (socket) => {
                            advance(3)
                            socket.emit("connect")
                            // a straggling error arrives after the socket already settled
                            socket.emit("error",
                                new Error("late failure"))
                        }

                        const components = await service.probeAll()

                        expect(byName(components,
                            "postgres")).toMatchObject({
                            status: "up",
                            message: null,
                        })
                        // one teardown per socket, not two
                        expect(mockSocket.destroyed).toBe(4)
                    })

                it.each([
                    [
                        "kafka-no-port",
                        "kafka-no-port",
                        9092,
                    ],
                    [
                        "broker:notanumber",
                        "broker",
                        9092,
                    ],
                    [
                        "10.0.0.4:19092",
                        "10.0.0.4",
                        19092,
                    ],
                ])("parses the kafka broker %s into host/port for the socket probe",
                    async (broker: string, host: string, port: number) => {
                        (envConfig as jest.Mock).mockReturnValue({
                            ...testConfig,
                            kafka: {
                                brokers: [
                                    broker,
                                ],
                            },
                        })

                        await service.probeAll()

                        expect(mockSocket.connects[3]).toEqual({
                            host,
                            port,
                        })
                    })
            })

        describe("mail probe",
            () => {
                it("verifies the SMTP transport with the configured credentials and closes it",
                    async () => {
                        const components = await service.probeAll()

                        expect(createTransport).toHaveBeenCalledWith({
                            host: "smtp-relay.brevo.com",
                            port: 587,
                            secure: false,
                            auth: {
                                user: "brevo-user",
                                // the mounted secret is trimmed before use
                                pass: "smtp-secret",
                            },
                        })
                        expect(verifyMock).toHaveBeenCalledTimes(1)
                        expect(closeMock).toHaveBeenCalledTimes(1)
                        expect(byName(components,
                            "mail").status).toBe("up")
                    })

                it("reports a rejected SMTP verify as down and still closes the transport",
                    async () => {
                        verifyMock.mockRejectedValue(new Error("535 auth failed"))

                        const components = await service.probeAll()

                        expect(byName(components,
                            "mail")).toMatchObject({
                            status: "down",
                            latencyMs: null,
                            message: "535 auth failed",
                        })
                        expect(closeMock).toHaveBeenCalledTimes(1)
                    })

                it("reports a slow SMTP handshake as degraded",
                    async () => {
                        verifyMock.mockImplementation(async () => {
                            advance(1_800)
                            return true
                        })

                        const components = await service.probeAll()

                        expect(byName(components,
                            "mail")).toMatchObject({
                            status: "degraded",
                            latencyMs: 1_800,
                        })
                    })
            })

        describe("AI balancer probe",
            () => {
                it("is up when every provider key is active",
                    async () => {
                        const components = await service.probeAll()

                        expect(byName(components,
                            "aiBalancer")).toEqual({
                            name: "aiBalancer",
                            status: "up",
                            latencyMs: null,
                            message: null,
                            checkedAt: expect.any(Date),
                            metrics: null,
                        })
                    })

                it("is degraded when some keys are disabled but capacity remains",
                    async () => {
                        aiBalancerService.healthSnapshot.mockResolvedValue({
                            providers: [
                                {
                                    activeKeys: 2,
                                    disabledKeys: 0,
                                },
                                {
                                    activeKeys: 0,
                                    disabledKeys: 4,
                                },
                            ],
                        })

                        const components = await service.probeAll()

                        expect(byName(components,
                            "aiBalancer").status).toBe("degraded")
                    })

                it("is down when no provider has a single active key left",
                    async () => {
                        aiBalancerService.healthSnapshot.mockResolvedValue({
                            providers: [
                                {
                                    activeKeys: 0,
                                    disabledKeys: 5,
                                },
                            ],
                        })

                        const components = await service.probeAll()

                        expect(byName(components,
                            "aiBalancer")).toMatchObject({
                            status: "down",
                            latencyMs: null,
                            message: "no active AI keys",
                        })
                    })

                it("is down with the reason when the key-pool snapshot itself fails",
                    async () => {
                        aiBalancerService.healthSnapshot.mockRejectedValue(
                            new Error("key store unreadable"),
                        )

                        const components = await service.probeAll()

                        expect(byName(components,
                            "aiBalancer")).toMatchObject({
                            status: "down",
                            message: "key store unreadable",
                        })
                    })
            })

        describe("external SaaS probes",
            () => {
                it("reuses each external result across sweeps until its own long TTL expires",
                    async () => {
                        await service.probeAll()
                        expect(fetchMock).toHaveBeenCalledTimes(11)

                        // past the sweep TTL but well inside the external TTL
                        advance(60_000)
                        await service.probeAll()

                        // only the 6 internal HTTP targets were re-fetched
                        expect(fetchMock).toHaveBeenCalledTimes(17)

                        // now push past the external TTL as well
                        advance(61_000)
                        await service.probeAll()

                        expect(fetchMock).toHaveBeenCalledTimes(28)
                        const lastEleven = fetchMock.mock.calls
                            .slice(-5)
                            .map((call: Array<unknown>) => call[0])
                        expect(lastEleven).toEqual(EXTERNAL_URLS)
                    })

                it("caches a down external result too, rather than re-probing a failing provider",
                    async () => {
                        fetchMock.mockImplementation(async (url: string) => {
                            if (url === "https://api.github.com") {
                                throw new Error("403 rate limited")
                            }
                            return {
                                status: 200,
                            }
                        })

                        const first = await service.probeAll()
                        expect(byName(first,
                            "github")).toMatchObject({
                            status: "down",
                            message: "403 rate limited",
                        })

                        advance(60_000)
                        const second = await service.probeAll()

                        // the cached failure is replayed; GitHub is not hit again
                        expect(byName(second,
                            "github")).toMatchObject({
                            status: "down",
                            message: "403 rate limited",
                        })
                        const githubCalls = fetchMock.mock.calls.filter(
                            (call: Array<unknown>) => call[0] === "https://api.github.com",
                        )
                        expect(githubCalls).toHaveLength(1)
                    })
            })
    })
