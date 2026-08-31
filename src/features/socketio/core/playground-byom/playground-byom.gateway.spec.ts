import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    PlaygroundSessionEntity,
} from "@modules/databases/postgresql/primary/entities/playground-session.entity"
import {
    PlaygroundStepEntity,
} from "@modules/databases/postgresql/primary/entities/playground-step.entity"
import {
    KeycloakTokenService,
} from "@modules/integrations/keycloak/token.service"
import {
    IoRedisInstanceKey,
} from "@modules/lib/native/ioredis/enums/instance-key"
import {
    createIoRedisKey,
} from "@modules/lib/native/ioredis/constants"
import {
    WsResponseService,
} from "@modules/platform/socketio/response.service"
import type {
    TypedSocket,
} from "@modules/platform/socketio/types/socket"
import {
    WinstonLog,
} from "@modules/platform/winston/enums/winston-log"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    makeEntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import type {
    EntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import {
    SubscriptionEvent,
} from "../enums/subscription-event"
import {
    PlaygroundByomGateway,
} from "./playground-byom.gateway"
import {
    PlaygroundByomRoomService,
} from "./playground-byom-room.service"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/** Room name the real {@link PlaygroundByomRoomService} builds for a session. */
const roomFor = (sessionId: string): string => `playground_byom:${sessionId}`

/** A jest-backed stand-in for one Socket.IO client socket. */
interface SocketMock {
    id: string
    data: Record<string, unknown>
    handshake: Record<string, unknown>
    join: jest.Mock
    to: jest.Mock
    emit: jest.Mock
    /** `emit` of the object `to(room)` returns -- the room-scoped relay. */
    roomEmit: jest.Mock
}

/** Overrides accepted by {@link makeSocket}. */
interface SocketOverrides {
    id?: string
    data?: Record<string, unknown>
    handshake?: Record<string, unknown>
}

/**
 * Build a socket mock whose `to(room)` returns a recording emitter, so a test
 * can assert both the room a relay targeted and the payload it carried.
 *
 * @param overrides - Socket id, `data` bag, and handshake to expose.
 * @returns the socket mock.
 */
const makeSocket = (
    overrides: SocketOverrides = {
    },
): SocketMock => {
    const roomEmit = jest.fn()
    return {
        id: overrides.id ?? "socket-1",
        data: overrides.data ?? {
        },
        handshake: overrides.handshake ?? {
            address: "10.0.0.1",
        },
        join: jest.fn(),
        to: jest.fn(() => ({
            emit: roomEmit,
        })),
        emit: jest.fn(),
        roomEmit,
    }
}

/**
 * Widen a socket mock to the `TypedSocket` the gateway handlers ask for.
 *
 * @param socket - The mock to widen.
 * @returns the same object, typed as a `TypedSocket`.
 */
const asSocket = (socket: SocketMock): TypedSocket => socket as unknown as TypedSocket

describe("PlaygroundByomGateway",
    () => {
        let module: TestingModule
        let gateway: PlaygroundByomGateway
        let entityManager: EntityManagerMock
        let redis: { incr: jest.Mock; ttl: jest.Mock; expire: jest.Mock }
        let winstonService: { log: jest.Mock }
        let wsResponseService: { successToRoom: jest.Mock }
        let verifyAccessToken: jest.Mock
        /** Sockets currently "connected" to the namespace, keyed by socket id. */
        let namespaceSockets: Map<string, unknown>
        /** `emit` of the object the namespace's `to(room)` returns. */
        let serverRoomEmit: jest.Mock
        let serverTo: jest.Mock
        let originalApp: unknown
        /** `get` of the stubbed global app ref the gateway resolves services from. */
        let appGet: jest.Mock

        beforeEach(async () => {
            entityManager = makeEntityManagerMock()
            redis = {
                incr: jest.fn().mockResolvedValue(1),
                ttl: jest.fn().mockResolvedValue(60),
                expire: jest.fn().mockResolvedValue(1),
            }
            winstonService = {
                log: jest.fn(),
            }
            wsResponseService = {
                successToRoom: jest.fn(),
            }
            verifyAccessToken = jest.fn()
            namespaceSockets = new Map()
            serverRoomEmit = jest.fn()
            serverTo = jest.fn(() => ({
                emit: serverRoomEmit,
            }))

            module = await Test.createTestingModule({
                providers: [
                    PlaygroundByomGateway,
                    // pure string builder (no I/O) -> use the real room service
                    PlaygroundByomRoomService,
                    {
                        provide: WsResponseService,
                        useValue: wsResponseService,
                    },
                    {
                        provide: WinstonService,
                        useValue: winstonService,
                    },
                    {
                        provide: createIoRedisKey(IoRedisInstanceKey.Cache),
                        useValue: redis,
                    },
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                ],
            }).compile()

            gateway = module.get<PlaygroundByomGateway>(PlaygroundByomGateway)

            // `@WebSocketServer()` is populated by the Nest WS adapter at boot; a unit
            // test wires the namespace stand-in itself.
            ;(gateway as unknown as {
                server: unknown
            }).server = {
                sockets: namespaceSockets,
                to: serverTo,
            }

            // the gateway resolves the token service off the global app ref rather
            // than by injection (the WS middleware pattern), so stub that ref.
            originalApp = globalThis.__APP__
            appGet = jest.fn(() => ({
                verifyAccessToken,
            }))
            ;(globalThis as unknown as {
                __APP__: unknown
            }).__APP__ = {
                get: appGet,
            }
        })

        afterEach(async () => {
            ;(globalThis as unknown as {
                __APP__: unknown
            }).__APP__ = originalApp
            await module.close()
        })

        describe("agent:pair",
            () => {
                /** A pairing code created just now, so the TTL check passes. */
                const freshSession = (
                    overrides: Record<string, unknown> = {
                    },
                ): Record<string, unknown> => ({
                    id: "session-1",
                    createdAt: new Date(),
                    connected: false,
                    currentStepIndex: 2,
                    playground: {
                        slug: "k8s-basics",
                    },
                    ...overrides,
                })

                it("pairs the agent, flips the session live and tells the browser room",
                    async () => {
                        const session = freshSession()
                        entityManager.findOne.mockResolvedValueOnce(session)
                        const client = makeSocket({
                            id: "agent-1",
                        })
                        const ack = jest.fn()

                        await gateway.handleAgentPair(
                            {
                                pairingCode: "code-abc",
                            },
                            asSocket(client),
                            ack,
                        )

                        // the code is resolved to its session, with the playground loaded
                        expect(entityManager.findOne).toHaveBeenCalledWith(
                            PlaygroundSessionEntity,
                            expect.objectContaining({
                                where: {
                                    pairingCode: "code-abc",
                                },
                            }),
                        )
                        // the session is marked connected and persisted
                        expect(session.connected).toBe(true)
                        expect(entityManager.save).toHaveBeenCalledWith(
                            PlaygroundSessionEntity,
                            session,
                        )
                        // the agent socket is bound to the session and joins its room
                        expect(client.data.sessionId).toBe("session-1")
                        expect(client.join).toHaveBeenCalledWith(roomFor("session-1"))
                        // the browser room is told the machine is live (agent excluded)
                        expect(client.to).toHaveBeenCalledWith(roomFor("session-1"))
                        expect(client.roomEmit).toHaveBeenCalledWith(
                            SubscriptionEvent.PlaygroundAgentConnected,
                            {
                                connected: true,
                            },
                        )
                        // the ack carries the context the CLI needs to resume
                        expect(ack).toHaveBeenCalledWith({
                            sessionId: "session-1",
                            playgroundSlug: "k8s-basics",
                            currentStepIndex: 2,
                        })
                    })

                it("rejects an unknown pairing code without touching the session store",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce(null)
                        const client = makeSocket()
                        const ack = jest.fn()

                        await gateway.handleAgentPair(
                            {
                                pairingCode: "nope",
                            },
                            asSocket(client),
                            ack,
                        )

                        expect(ack).toHaveBeenCalledWith({
                            error: "Invalid or expired pairing code.",
                        })
                        expect(entityManager.save).not.toHaveBeenCalled()
                        expect(client.join).not.toHaveBeenCalled()
                    })

                it("rejects a pairing code older than its 30 minute lifetime",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce(freshSession({
                            // 31 minutes old -> past the pairing-code TTL
                            createdAt: new Date(Date.now() - (31 * 60 * 1000)),
                        }))
                        const client = makeSocket()
                        const ack = jest.fn()

                        await gateway.handleAgentPair(
                            {
                                pairingCode: "stale",
                            },
                            asSocket(client),
                            ack,
                        )

                        expect(ack).toHaveBeenCalledWith({
                            error: "This pairing code has expired — restart the lab for a new one.",
                        })
                        expect(entityManager.save).not.toHaveBeenCalled()
                    })

                it("refuses a second live agent on a code that already has one connected",
                    async () => {
                        // first agent pairs and takes the binding
                        entityManager.findOne.mockResolvedValueOnce(freshSession())
                        const first = makeSocket({
                            id: "agent-1",
                        })
                        await gateway.handleAgentPair(
                            {
                                pairingCode: "code-abc",
                            },
                            asSocket(first),
                            jest.fn(),
                        )
                        // that socket is still connected to the namespace
                        namespaceSockets.set("agent-1",
                            first)

                        // a second, different agent tries the same code
                        entityManager.findOne.mockResolvedValueOnce(freshSession())
                        const second = makeSocket({
                            id: "agent-2",
                        })
                        const ack = jest.fn()
                        await gateway.handleAgentPair(
                            {
                                pairingCode: "code-abc",
                            },
                            asSocket(second),
                            ack,
                        )

                        expect(ack).toHaveBeenCalledWith({
                            error: "This session already has a connected machine.",
                        })
                        // the rogue agent never joined the room
                        expect(second.join).not.toHaveBeenCalled()
                    })

                it("lets the SAME agent socket re-pair on its existing binding",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce(freshSession())
                        const client = makeSocket({
                            id: "agent-1",
                        })
                        await gateway.handleAgentPair(
                            {
                                pairingCode: "code-abc",
                            },
                            asSocket(client),
                            jest.fn(),
                        )
                        namespaceSockets.set("agent-1",
                            client)

                        entityManager.findOne.mockResolvedValueOnce(freshSession())
                        const ack = jest.fn()
                        await gateway.handleAgentPair(
                            {
                                pairingCode: "code-abc",
                            },
                            asSocket(client),
                            ack,
                        )

                        // same socket id -> not a competing agent
                        expect(ack).toHaveBeenCalledWith(
                            expect.objectContaining({
                                sessionId: "session-1",
                            }),
                        )
                    })

                it("lets a reconnecting agent take over a binding whose socket is gone",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce(freshSession())
                        await gateway.handleAgentPair(
                            {
                                pairingCode: "code-abc",
                            },
                            asSocket(makeSocket({
                                id: "agent-old",
                            })),
                            jest.fn(),
                        )
                        // "agent-old" is NOT in the namespace -- that socket died

                        entityManager.findOne.mockResolvedValueOnce(freshSession())
                        const fresh = makeSocket({
                            id: "agent-new",
                        })
                        const ack = jest.fn()
                        await gateway.handleAgentPair(
                            {
                                pairingCode: "code-abc",
                            },
                            asSocket(fresh),
                            ack,
                        )

                        expect(ack).toHaveBeenCalledWith(
                            expect.objectContaining({
                                sessionId: "session-1",
                            }),
                        )
                        expect(fresh.join).toHaveBeenCalledWith(roomFor("session-1"))
                    })

                it("throttles brute-force pairing attempts from one source IP",
                    async () => {
                        // 21st attempt inside the window -> over the budget of 20
                        redis.incr.mockResolvedValueOnce(21)
                        const client = makeSocket()
                        const ack = jest.fn()

                        await gateway.handleAgentPair(
                            {
                                pairingCode: "guess",
                            },
                            asSocket(client),
                            ack,
                        )

                        expect(redis.incr).toHaveBeenCalledWith(
                            "playground-byom:pair-rate:10.0.0.1",
                        )
                        expect(ack).toHaveBeenCalledWith({
                            error: "Too many attempts — wait a moment and try again.",
                        })
                        // the code is never even looked up once throttled
                        expect(entityManager.findOne).not.toHaveBeenCalled()
                    })

                it("stamps the fixed window TTL only on the first attempt of a window",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce(freshSession())

                        await gateway.handleAgentPair(
                            {
                                pairingCode: "code-abc",
                            },
                            asSocket(makeSocket()),
                            jest.fn(),
                        )

                        expect(redis.expire).toHaveBeenCalledWith(
                            "playground-byom:pair-rate:10.0.0.1",
                            60,
                        )
                        // the first INCR already tells us it is a new window
                        expect(redis.ttl).not.toHaveBeenCalled()
                    })

                it("leaves an already-ticking window's TTL alone",
                    async () => {
                        redis.incr.mockResolvedValueOnce(2)
                        redis.ttl.mockResolvedValueOnce(42)
                        entityManager.findOne.mockResolvedValueOnce(freshSession())

                        await gateway.handleAgentPair(
                            {
                                pairingCode: "code-abc",
                            },
                            asSocket(makeSocket()),
                            jest.fn(),
                        )

                        expect(redis.ttl).toHaveBeenCalled()
                        expect(redis.expire).not.toHaveBeenCalled()
                    })

                it("re-arms the TTL on a counter key that lost its expiry",
                    async () => {
                        redis.incr.mockResolvedValueOnce(5)
                        // -1 == key exists with no TTL, which would wedge the window open
                        redis.ttl.mockResolvedValueOnce(-1)
                        entityManager.findOne.mockResolvedValueOnce(freshSession())

                        await gateway.handleAgentPair(
                            {
                                pairingCode: "code-abc",
                            },
                            asSocket(makeSocket()),
                            jest.fn(),
                        )

                        expect(redis.expire).toHaveBeenCalledWith(
                            "playground-byom:pair-rate:10.0.0.1",
                            60,
                        )
                    })

                it("fails OPEN and logs when the rate-limit cache is down",
                    async () => {
                        redis.incr.mockRejectedValueOnce(new Error("redis down"))
                        entityManager.findOne.mockResolvedValueOnce(freshSession())
                        const ack = jest.fn()

                        await gateway.handleAgentPair(
                            {
                                pairingCode: "code-abc",
                            },
                            asSocket(makeSocket()),
                            ack,
                        )

                        expect(winstonService.log).toHaveBeenCalledWith(
                            WinstonLog.BestEffortOperationFailed,
                            expect.objectContaining({
                                op: "playground-byom.pair-rate-limit",
                                error: "redis down",
                            }),
                        )
                        // a cache outage must not lock a legitimate learner out
                        expect(ack).toHaveBeenCalledWith(
                            expect.objectContaining({
                                sessionId: "session-1",
                            }),
                        )
                    })

                it("stringifies a non-Error rate-limit failure before logging it",
                    async () => {
                        redis.incr.mockRejectedValueOnce("connection reset")
                        entityManager.findOne.mockResolvedValueOnce(freshSession())

                        await gateway.handleAgentPair(
                            {
                                pairingCode: "code-abc",
                            },
                            asSocket(makeSocket()),
                            jest.fn(),
                        )

                        expect(winstonService.log).toHaveBeenCalledWith(
                            WinstonLog.BestEffortOperationFailed,
                            expect.objectContaining({
                                error: "connection reset",
                            }),
                        )
                    })
            })

        describe("browser:subscribe",
            () => {
                it("marks the owner browser when its token matches the session's user",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce({
                            id: "session-1",
                            connected: true,
                            currentStepIndex: 2,
                            passedStepIndexes: [
                                0,
                                1,
                            ],
                            user: {
                                keycloakId: "kc-1",
                            },
                        })
                        verifyAccessToken.mockResolvedValueOnce({
                            active: true,
                            sub: "kc-1",
                        })
                        const client = makeSocket({
                            handshake: {
                                auth: {
                                    token: "jwt-1",
                                },
                            },
                        })

                        await gateway.handleBrowserSubscribe(
                            {
                                sessionId: "session-1",
                            },
                            asSocket(client),
                        )

                        // the token service is pulled off the global app ref (the WS
                        // middleware pattern), resolved non-strictly across modules
                        expect(appGet).toHaveBeenCalledWith(
                            KeycloakTokenService,
                            {
                                strict: false,
                            },
                        )
                        expect(verifyAccessToken).toHaveBeenCalledWith("jwt-1")
                        // the ownership flag `command:run` gates on
                        expect(client.data.ownedSessionId).toBe("session-1")
                        expect(client.data.userId).toBe("kc-1")
                        expect(client.join).toHaveBeenCalledWith(roomFor("session-1"))
                        // an already-paired session seeds the UI as connected
                        expect(client.emit).toHaveBeenCalledWith(
                            SubscriptionEvent.PlaygroundAgentConnected,
                            {
                                connected: true,
                            },
                        )
                        expect(client.emit).toHaveBeenCalledWith(
                            SubscriptionEvent.PlaygroundSessionProgress,
                            {
                                currentStepIndex: 2,
                                passedStepIndexes: [
                                    0,
                                    1,
                                ],
                            },
                        )
                    })

                it("reads the token from the query string when there is no auth payload",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce({
                            id: "session-1",
                            connected: false,
                            user: {
                                keycloakId: "kc-1",
                            },
                        })
                        verifyAccessToken.mockResolvedValueOnce({
                            active: true,
                            sub: "kc-1",
                        })
                        const client = makeSocket({
                            handshake: {
                                query: {
                                    token: "jwt-query",
                                },
                            },
                        })

                        await gateway.handleBrowserSubscribe(
                            {
                                sessionId: "session-1",
                            },
                            asSocket(client),
                        )

                        expect(verifyAccessToken).toHaveBeenCalledWith("jwt-query")
                        expect(client.data.ownedSessionId).toBe("session-1")
                        // no agent yet -> the UI stays gated on "waiting"
                        expect(client.emit).toHaveBeenCalledWith(
                            SubscriptionEvent.PlaygroundAgentDisconnected,
                            {
                                connected: false,
                            },
                        )
                    })

                it("leaves a browser unmarked when the session does not exist",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce(null)
                        const client = makeSocket({
                            handshake: {
                                auth: {
                                    token: "jwt-1",
                                },
                            },
                        })

                        await gateway.handleBrowserSubscribe(
                            {
                                sessionId: "ghost",
                            },
                            asSocket(client),
                        )

                        expect(verifyAccessToken).not.toHaveBeenCalled()
                        expect(client.data.ownedSessionId).toBeUndefined()
                        // it may still observe the room, just not command it
                        expect(client.join).toHaveBeenCalledWith(roomFor("ghost"))
                        expect(client.emit).toHaveBeenCalledWith(
                            SubscriptionEvent.PlaygroundAgentDisconnected,
                            {
                                connected: false,
                            },
                        )
                    })

                it("leaves a browser unmarked when the session has no owner loaded",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce({
                            id: "session-1",
                            connected: true,
                            user: undefined,
                        })
                        const client = makeSocket({
                            handshake: {
                                auth: {
                                    token: "jwt-1",
                                },
                            },
                        })

                        await gateway.handleBrowserSubscribe(
                            {
                                sessionId: "session-1",
                            },
                            asSocket(client),
                        )

                        expect(verifyAccessToken).not.toHaveBeenCalled()
                        expect(client.data.ownedSessionId).toBeUndefined()
                    })

                it("leaves an anonymous browser unmarked when no token is supplied at all",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce({
                            id: "session-1",
                            connected: true,
                            user: {
                                keycloakId: "kc-1",
                            },
                        })
                        const client = makeSocket({
                            handshake: {
                            },
                        })

                        await gateway.handleBrowserSubscribe(
                            {
                                sessionId: "session-1",
                            },
                            asSocket(client),
                        )

                        expect(verifyAccessToken).not.toHaveBeenCalled()
                        expect(client.data.ownedSessionId).toBeUndefined()
                    })

                it("leaves a browser unmarked when the token is not a plain string",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce({
                            id: "session-1",
                            connected: true,
                            user: {
                                keycloakId: "kc-1",
                            },
                        })
                        const client = makeSocket({
                            handshake: {
                                // a repeated ?token= query param arrives as an array
                                query: {
                                    token: [
                                        "jwt-a",
                                        "jwt-b",
                                    ],
                                },
                            },
                        })

                        await gateway.handleBrowserSubscribe(
                            {
                                sessionId: "session-1",
                            },
                            asSocket(client),
                        )

                        expect(verifyAccessToken).not.toHaveBeenCalled()
                        expect(client.data.ownedSessionId).toBeUndefined()
                    })

                it("leaves a browser unmarked when its token belongs to a different user",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce({
                            id: "session-1",
                            connected: true,
                            user: {
                                keycloakId: "kc-owner",
                            },
                        })
                        verifyAccessToken.mockResolvedValueOnce({
                            active: true,
                            sub: "kc-intruder",
                        })
                        const client = makeSocket({
                            handshake: {
                                auth: {
                                    token: "jwt-foreign",
                                },
                            },
                        })

                        await gateway.handleBrowserSubscribe(
                            {
                                sessionId: "session-1",
                            },
                            asSocket(client),
                        )

                        expect(client.data.ownedSessionId).toBeUndefined()
                        expect(client.data.userId).toBeUndefined()
                    })

                it("leaves a browser unmarked when its token is inactive",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce({
                            id: "session-1",
                            connected: true,
                            user: {
                                keycloakId: "kc-1",
                            },
                        })
                        verifyAccessToken.mockResolvedValueOnce({
                            active: false,
                            sub: "kc-1",
                        })
                        const client = makeSocket({
                            handshake: {
                                auth: {
                                    token: "jwt-expired",
                                },
                            },
                        })

                        await gateway.handleBrowserSubscribe(
                            {
                                sessionId: "session-1",
                            },
                            asSocket(client),
                        )

                        expect(client.data.ownedSessionId).toBeUndefined()
                    })

                it("leaves a browser unmarked when introspection returns nothing",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce({
                            id: "session-1",
                            connected: true,
                            user: {
                                keycloakId: "kc-1",
                            },
                        })
                        verifyAccessToken.mockResolvedValueOnce(undefined)
                        const client = makeSocket({
                            handshake: {
                                auth: {
                                    token: "jwt-1",
                                },
                            },
                        })

                        await gateway.handleBrowserSubscribe(
                            {
                                sessionId: "session-1",
                            },
                            asSocket(client),
                        )

                        expect(client.data.ownedSessionId).toBeUndefined()
                    })

                it("leaves a browser unmarked when token verification throws",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce({
                            id: "session-1",
                            connected: true,
                            user: {
                                keycloakId: "kc-1",
                            },
                        })
                        verifyAccessToken.mockRejectedValueOnce(new Error("keycloak unreachable"))
                        const client = makeSocket({
                            handshake: {
                                auth: {
                                    token: "jwt-1",
                                },
                            },
                        })

                        await gateway.handleBrowserSubscribe(
                            {
                                sessionId: "session-1",
                            },
                            asSocket(client),
                        )

                        // an unverifiable token degrades to read-only, it does not throw
                        expect(client.data.ownedSessionId).toBeUndefined()
                        expect(client.join).toHaveBeenCalledWith(roomFor("session-1"))
                    })
            })

        describe("command:run authorization",
            () => {
                it("relays a command from the verified owner browser to the paired agent",
                    () => {
                        const client = makeSocket({
                            data: {
                                ownedSessionId: "session-1",
                            },
                        })

                        gateway.handleCommandRun(
                            {
                                sessionId: "session-1",
                                command: "kubectl get pods",
                            },
                            asSocket(client),
                        )

                        // socket.to(room) excludes the sender, so only the agent hears it
                        expect(client.to).toHaveBeenCalledWith(roomFor("session-1"))
                        expect(client.roomEmit).toHaveBeenCalledWith(
                            SubscriptionEvent.PlaygroundCommandRun,
                            {
                                command: "kubectl get pods",
                            },
                        )
                    })

                it("refuses to relay a command from a socket that does not own the session",
                    () => {
                        // the classic attack: a socket that guessed the pairing code and
                        // learned the session id, trying to run a shell on the learner's box
                        const client = makeSocket({
                            id: "rogue-1",
                            data: {
                                ownedSessionId: undefined,
                            },
                        })

                        gateway.handleCommandRun(
                            {
                                sessionId: "session-1",
                                command: "rm -rf /",
                            },
                            asSocket(client),
                        )

                        expect(client.to).not.toHaveBeenCalled()
                        expect(client.roomEmit).not.toHaveBeenCalled()
                        expect(winstonService.log).toHaveBeenCalledWith(
                            WinstonLog.BestEffortOperationFailed,
                            expect.objectContaining({
                                op: "playground-byom.command-run.not-owner",
                                sessionId: "session-1",
                                meta: {
                                    socketId: "rogue-1",
                                },
                            }),
                        )
                    })

                it("refuses to relay a command aimed at a session the socket does not own",
                    () => {
                        const client = makeSocket({
                            data: {
                                ownedSessionId: "session-mine",
                            },
                        })

                        gateway.handleCommandRun(
                            {
                                sessionId: "session-someone-else",
                                command: "cat /etc/shadow",
                            },
                            asSocket(client),
                        )

                        expect(client.roomEmit).not.toHaveBeenCalled()
                    })
            })

        describe("verify:now",
            () => {
                it("relays a verify request from the owner browser",
                    () => {
                        const client = makeSocket({
                            data: {
                                ownedSessionId: "session-1",
                            },
                        })

                        gateway.handleVerifyNow(
                            {
                                sessionId: "session-1",
                            },
                            asSocket(client),
                        )

                        expect(client.to).toHaveBeenCalledWith(roomFor("session-1"))
                        expect(client.roomEmit).toHaveBeenCalledWith(
                            SubscriptionEvent.PlaygroundVerifyNow,
                            {
                            },
                        )
                    })

                it("silently drops a verify request from a non-owner socket",
                    () => {
                        const client = makeSocket({
                            data: {
                            },
                        })

                        gateway.handleVerifyNow(
                            {
                                sessionId: "session-1",
                            },
                            asSocket(client),
                        )

                        expect(client.roomEmit).not.toHaveBeenCalled()
                    })
            })

        describe("agent relays",
            () => {
                it("relays command output up to the browser room using the bound session",
                    () => {
                        const client = makeSocket({
                            data: {
                                sessionId: "session-1",
                            },
                        })

                        gateway.handleCommandOutput(
                            {
                                output: "pod/web-1 Running",
                            },
                            asSocket(client),
                        )

                        expect(client.to).toHaveBeenCalledWith(roomFor("session-1"))
                        expect(client.roomEmit).toHaveBeenCalledWith(
                            SubscriptionEvent.PlaygroundCommandOutput,
                            {
                                output: "pod/web-1 Running",
                            },
                        )
                    })

                it("drops command output emitted before the agent paired",
                    () => {
                        const client = makeSocket({
                            data: {
                            },
                        })

                        gateway.handleCommandOutput(
                            {
                                output: "orphaned",
                            },
                            asSocket(client),
                        )

                        expect(client.roomEmit).not.toHaveBeenCalled()
                    })

                it("relays a browser ping down to the room's agent",
                    () => {
                        const client = makeSocket()

                        gateway.handleAgentPing(
                            {
                                sessionId: "session-1",
                                t: 1234,
                            },
                            asSocket(client),
                        )

                        expect(client.to).toHaveBeenCalledWith(roomFor("session-1"))
                        expect(client.roomEmit).toHaveBeenCalledWith(
                            SubscriptionEvent.PlaygroundAgentPing,
                            {
                                t: 1234,
                            },
                        )
                    })

                it("relays the agent's pong back up using the bound session",
                    () => {
                        const client = makeSocket({
                            data: {
                                sessionId: "session-1",
                            },
                        })

                        gateway.handleAgentPong(
                            {
                                t: 1234,
                            },
                            asSocket(client),
                        )

                        expect(client.roomEmit).toHaveBeenCalledWith(
                            SubscriptionEvent.PlaygroundAgentPong,
                            {
                                t: 1234,
                            },
                        )
                    })

                it("drops a pong emitted before the agent paired",
                    () => {
                        const client = makeSocket({
                            data: {
                            },
                        })

                        gateway.handleAgentPong(
                            {
                                t: 1234,
                            },
                            asSocket(client),
                        )

                        expect(client.roomEmit).not.toHaveBeenCalled()
                    })
            })

        describe("disconnect",
            () => {
                it("marks the session offline and re-gates the browser room when the agent drops",
                    async () => {
                        const session = {
                            id: "session-1",
                            connected: true,
                        }
                        entityManager.findOne.mockResolvedValueOnce(session)
                        const client = makeSocket({
                            id: "agent-1",
                            data: {
                                sessionId: "session-1",
                            },
                        })

                        await gateway.handleDisconnect(asSocket(client))

                        expect(session.connected).toBe(false)
                        expect(entityManager.save).toHaveBeenCalledWith(
                            PlaygroundSessionEntity,
                            session,
                        )
                        // the agent is already gone, so this fans out via the namespace
                        expect(serverTo).toHaveBeenCalledWith(roomFor("session-1"))
                        expect(serverRoomEmit).toHaveBeenCalledWith(
                            SubscriptionEvent.PlaygroundAgentDisconnected,
                            {
                                connected: false,
                            },
                        )
                    })

                it("ignores a browser drop, which carries no bound session",
                    async () => {
                        const client = makeSocket({
                            data: {
                            },
                        })

                        await gateway.handleDisconnect(asSocket(client))

                        expect(entityManager.findOne).not.toHaveBeenCalled()
                        expect(serverTo).not.toHaveBeenCalled()
                    })

                it("still re-gates the room when the session row has already gone",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce(null)
                        const client = makeSocket({
                            data: {
                                sessionId: "session-1",
                            },
                        })

                        await gateway.handleDisconnect(asSocket(client))

                        expect(entityManager.save).not.toHaveBeenCalled()
                        expect(serverRoomEmit).toHaveBeenCalledWith(
                            SubscriptionEvent.PlaygroundAgentDisconnected,
                            {
                                connected: false,
                            },
                        )
                    })

                it("releases the single-agent binding so the learner can pair again",
                    async () => {
                        // pair agent-1, then drop it
                        entityManager.findOne.mockResolvedValueOnce({
                            id: "session-1",
                            createdAt: new Date(),
                            connected: false,
                            currentStepIndex: 0,
                            playground: {
                                slug: "k8s",
                            },
                        })
                        const first = makeSocket({
                            id: "agent-1",
                        })
                        await gateway.handleAgentPair(
                            {
                                pairingCode: "code-abc",
                            },
                            asSocket(first),
                            jest.fn(),
                        )
                        namespaceSockets.set("agent-1",
                            first)

                        entityManager.findOne.mockResolvedValueOnce({
                            id: "session-1",
                            connected: true,
                        })
                        await gateway.handleDisconnect(asSocket(first))
                        namespaceSockets.delete("agent-1")

                        // a different machine can now claim the session
                        entityManager.findOne.mockResolvedValueOnce({
                            id: "session-1",
                            createdAt: new Date(),
                            connected: false,
                            currentStepIndex: 0,
                            playground: {
                                slug: "k8s",
                            },
                        })
                        const second = makeSocket({
                            id: "agent-2",
                        })
                        const ack = jest.fn()
                        await gateway.handleAgentPair(
                            {
                                pairingCode: "code-abc",
                            },
                            asSocket(second),
                            ack,
                        )

                        expect(ack).toHaveBeenCalledWith(
                            expect.objectContaining({
                                sessionId: "session-1",
                            }),
                        )
                    })

                it("leaves a binding held by a DIFFERENT socket intact",
                    async () => {
                        // agent-1 owns the binding
                        entityManager.findOne.mockResolvedValueOnce({
                            id: "session-1",
                            createdAt: new Date(),
                            connected: false,
                            currentStepIndex: 0,
                            playground: {
                                slug: "k8s",
                            },
                        })
                        const owner = makeSocket({
                            id: "agent-1",
                        })
                        await gateway.handleAgentPair(
                            {
                                pairingCode: "code-abc",
                            },
                            asSocket(owner),
                            jest.fn(),
                        )
                        namespaceSockets.set("agent-1",
                            owner)

                        // a stale socket that never held the binding disconnects
                        entityManager.findOne.mockResolvedValueOnce({
                            id: "session-1",
                            connected: true,
                        })
                        await gateway.handleDisconnect(asSocket(makeSocket({
                            id: "agent-stale",
                            data: {
                                sessionId: "session-1",
                            },
                        })))

                        // agent-1 still holds it, so a third machine is still refused
                        entityManager.findOne.mockResolvedValueOnce({
                            id: "session-1",
                            createdAt: new Date(),
                            connected: false,
                            currentStepIndex: 0,
                            playground: {
                                slug: "k8s",
                            },
                        })
                        const intruder = makeSocket({
                            id: "agent-3",
                        })
                        const ack = jest.fn()
                        await gateway.handleAgentPair(
                            {
                                pairingCode: "code-abc",
                            },
                            asSocket(intruder),
                            ack,
                        )

                        expect(ack).toHaveBeenCalledWith({
                            error: "This session already has a connected machine.",
                        })
                    })
            })

        describe("resources:report and step verification",
            () => {
                /** Program the session row then the step row `verifyCurrentStep` reads. */
                const stubVerify = (
                    session: unknown,
                    step: unknown,
                ): void => {
                    entityManager.findOne.mockImplementation(async (entity: unknown) => {
                        if (entity === PlaygroundSessionEntity) {
                            return session
                        }
                        if (entity === PlaygroundStepEntity) {
                            return step
                        }
                        return null
                    })
                }

                /** An agent socket already bound to `session-1`. */
                const agent = (): SocketMock => makeSocket({
                    id: "agent-1",
                    data: {
                        sessionId: "session-1",
                    },
                })

                it("relays an observational snapshot without advancing progress",
                    async () => {
                        const client = agent()

                        await gateway.handleResourcesReport(
                            {
                                verificationRequested: false,
                                resources: [
                                    {
                                        kind: "Pod",
                                        name: "web-7d9f",
                                        status: "Running",
                                    },
                                ],
                            },
                            asSocket(client),
                        )

                        expect(client.roomEmit).toHaveBeenCalledWith(
                            SubscriptionEvent.PlaygroundResourcesReport,
                            {
                                resources: [
                                    {
                                        kind: "Pod",
                                        name: "web-7d9f",
                                        status: "Running",
                                    },
                                ],
                            },
                        )
                        expect(entityManager.findOne).not.toHaveBeenCalled()
                        expect(entityManager.save).not.toHaveBeenCalled()
                        expect(wsResponseService.successToRoom).not.toHaveBeenCalled()
                    })

                it("relays the snapshot, passes the matching step and advances the pointer",
                    async () => {
                        const session = {
                            id: "session-1",
                            playgroundId: "pg-1",
                            currentStepIndex: 0,
                            passedStepIndexes: [
                            ],
                        }
                        stubVerify(
                            session,
                            {
                                verifyResourceKind: "Pod",
                                verifyResourceNamePattern: "web",
                                verifyExpectedStatus: "Running",
                            },
                        )
                        const client = agent()

                        await gateway.handleResourcesReport(
                            {
                                verificationRequested: true,
                                resources: [
                                    {
                                        kind: "Pod",
                                        name: "web-7d9f",
                                        status: "Running",
                                    },
                                ],
                            },
                            asSocket(client),
                        )

                        // the snapshot is relayed to the browsers (agent excluded)
                        expect(client.roomEmit).toHaveBeenCalledWith(
                            SubscriptionEvent.PlaygroundResourcesReport,
                            {
                                resources: [
                                    {
                                        kind: "Pod",
                                        name: "web-7d9f",
                                        status: "Running",
                                    },
                                ],
                            },
                        )
                        // the step is recorded as passed and the pointer moves on, so the
                        // NEXT report verifies step 1 rather than re-verifying step 0
                        expect(session.passedStepIndexes).toEqual([
                            0,
                        ])
                        expect(session.currentStepIndex).toBe(1)
                        expect(entityManager.save).toHaveBeenCalledWith(
                            PlaygroundSessionEntity,
                            session,
                        )
                        expect(wsResponseService.successToRoom).toHaveBeenCalledWith(
                            expect.objectContaining({
                                message: "Playground step verified",
                                data: {
                                    stepIndex: 0,
                                },
                                room: roomFor("session-1"),
                                eventName: SubscriptionEvent.PlaygroundStepVerified,
                            }),
                        )
                    })

                it("passes a step whose pattern accepts any status",
                    async () => {
                        const session = {
                            id: "session-1",
                            playgroundId: "pg-1",
                            currentStepIndex: 3,
                            passedStepIndexes: [
                                0,
                            ],
                        }
                        stubVerify(
                            session,
                            {
                                verifyResourceKind: "Deployment",
                                // an empty pattern matches any name
                                verifyResourceNamePattern: "",
                                verifyExpectedStatus: null,
                            },
                        )

                        await gateway.handleResourcesReport(
                            {
                                verificationRequested: true,
                                resources: [
                                    {
                                        kind: "Deployment",
                                        name: "anything-at-all",
                                        status: "Whatever",
                                    },
                                ],
                            },
                            asSocket(agent()),
                        )

                        expect(session.passedStepIndexes).toEqual([
                            0,
                            3,
                        ])
                        expect(session.currentStepIndex).toBe(4)
                    })

                it("does not pass a step when the resource kind, name or status disagree",
                    async () => {
                        const session = {
                            id: "session-1",
                            playgroundId: "pg-1",
                            currentStepIndex: 0,
                            passedStepIndexes: [
                            ],
                        }
                        stubVerify(
                            session,
                            {
                                verifyResourceKind: "Pod",
                                verifyResourceNamePattern: "web",
                                verifyExpectedStatus: "Running",
                            },
                        )
                        const client = agent()

                        await gateway.handleResourcesReport(
                            {
                                verificationRequested: true,
                                resources: [
                                    {
                                        // wrong kind
                                        kind: "Service",
                                        name: "web-1",
                                        status: "Running",
                                    },
                                    {
                                        // right kind, wrong name
                                        kind: "Pod",
                                        name: "database-1",
                                        status: "Running",
                                    },
                                    {
                                        // right kind and name, wrong status
                                        kind: "Pod",
                                        name: "web-2",
                                        status: "CrashLoopBackOff",
                                    },
                                ],
                            },
                            asSocket(client),
                        )

                        // the report still reaches the browsers, but nothing passes
                        expect(client.roomEmit).toHaveBeenCalled()
                        expect(session.passedStepIndexes).toEqual([
                        ])
                        expect(session.currentStepIndex).toBe(0)
                        expect(entityManager.save).not.toHaveBeenCalled()
                        expect(wsResponseService.successToRoom).not.toHaveBeenCalled()
                    })

                it("does not re-pass a step the learner already cleared",
                    async () => {
                        const session = {
                            id: "session-1",
                            playgroundId: "pg-1",
                            currentStepIndex: 2,
                            passedStepIndexes: [
                                2,
                            ],
                        }
                        stubVerify(
                            session,
                            {
                                verifyResourceKind: "Pod",
                                verifyResourceNamePattern: "web",
                                verifyExpectedStatus: null,
                            },
                        )

                        await gateway.handleResourcesReport(
                            {
                                verificationRequested: true,
                                resources: [
                                    {
                                        kind: "Pod",
                                        name: "web-1",
                                        status: "Running",
                                    },
                                ],
                            },
                            asSocket(agent()),
                        )

                        // the step row is never even loaded once the index is known passed
                        expect(entityManager.findOne).not.toHaveBeenCalledWith(
                            PlaygroundStepEntity,
                            expect.anything(),
                        )
                        expect(wsResponseService.successToRoom).not.toHaveBeenCalled()
                    })

                it("verifies nothing when the session row has gone",
                    async () => {
                        stubVerify(null,
                            null)
                        const client = agent()

                        await gateway.handleResourcesReport(
                            {
                                verificationRequested: true,
                                resources: [
                                ],
                            },
                            asSocket(client),
                        )

                        expect(client.roomEmit).toHaveBeenCalled()
                        expect(wsResponseService.successToRoom).not.toHaveBeenCalled()
                    })

                it("verifies nothing when the current step has no configured row",
                    async () => {
                        stubVerify(
                            {
                                id: "session-1",
                                playgroundId: "pg-1",
                                currentStepIndex: 9,
                                passedStepIndexes: [
                                ],
                            },
                            null,
                        )

                        await gateway.handleResourcesReport(
                            {
                                verificationRequested: true,
                                resources: [
                                    {
                                        kind: "Pod",
                                        name: "web",
                                        status: "Running",
                                    },
                                ],
                            },
                            asSocket(agent()),
                        )

                        expect(wsResponseService.successToRoom).not.toHaveBeenCalled()
                    })

                it("drops a report emitted before the agent paired",
                    async () => {
                        const client = makeSocket({
                            data: {
                            },
                        })

                        await gateway.handleResourcesReport(
                            {
                                verificationRequested: true,
                                resources: [
                                ],
                            },
                            asSocket(client),
                        )

                        expect(client.roomEmit).not.toHaveBeenCalled()
                        expect(entityManager.findOne).not.toHaveBeenCalled()
                    })

                it("keeps the live relay working when verification blows up",
                    async () => {
                        entityManager.findOne.mockRejectedValueOnce(new Error("db gone"))
                        const client = agent()

                        await gateway.handleResourcesReport(
                            {
                                verificationRequested: true,
                                resources: [
                                    {
                                        kind: "Pod",
                                        name: "web",
                                        status: "Running",
                                    },
                                ],
                            },
                            asSocket(client),
                        )

                        // the browsers still got the snapshot
                        expect(client.roomEmit).toHaveBeenCalledWith(
                            SubscriptionEvent.PlaygroundResourcesReport,
                            expect.anything(),
                        )
                        expect(winstonService.log).toHaveBeenCalledWith(
                            WinstonLog.BestEffortOperationFailed,
                            expect.objectContaining({
                                op: "playground-byom.verify-current-step",
                                sessionId: "session-1",
                                error: "db gone",
                            }),
                        )
                    })

                it("stringifies a non-Error verification failure before logging it",
                    async () => {
                        entityManager.findOne.mockRejectedValueOnce("pool exhausted")

                        await gateway.handleResourcesReport(
                            {
                                verificationRequested: true,
                                resources: [
                                ],
                            },
                            asSocket(agent()),
                        )

                        expect(winstonService.log).toHaveBeenCalledWith(
                            WinstonLog.BestEffortOperationFailed,
                            expect.objectContaining({
                                error: "pool exhausted",
                            }),
                        )
                    })
            })
    })
