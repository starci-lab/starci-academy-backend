import {
    WinstonLog,
} from "@modules/platform/winston/enums/winston-log"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    Ack,
    ConnectedSocket,
    MessageBody,
    type OnGatewayDisconnect,
    SubscribeMessage,
    WebSocketServer,
} from "@nestjs/websockets"
import type {
    Namespace,
} from "socket.io"
import {
    PlaygroundByomWebSocketGateway,
} from "@modules/platform/socketio/decorators/gateway"
import {
    WsResponseService,
} from "@modules/platform/socketio/response.service"
import type {
    TypedSocket,
} from "@modules/platform/socketio/types/socket"
import {
    type EntityManager,
} from "typeorm"
import {
    PlaygroundSessionEntity,
} from "@modules/databases/postgresql/primary/entities/playground-session.entity"
import {
    PlaygroundStepEntity,
} from "@modules/databases/postgresql/primary/entities/playground-step.entity"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    PublicationEvent,
} from "../enums/publication-event"
import {
    SubscriptionEvent,
} from "../enums/subscription-event"
import {
    PlaygroundByomRoomService,
} from "./playground-byom-room.service"
import {
    KeycloakTokenService,
} from "@modules/integrations/keycloak/token.service"
import {
    IoRedisInstanceKey,
} from "@modules/lib/native/ioredis/enums/instance-key"
import {
    InjectIoRedis,
} from "@modules/lib/native/ioredis/ioredis.decorators"
import type {
    Redis,
} from "ioredis"
import type {
    AgentPairAck,
    AgentPairSocketIoPayload,
    AgentPingSocketIoPayload,
    AgentPongSocketIoPayload,
    BrowserSubscribeSocketIoPayload,
    CommandOutputSocketIoPayload,
    CommandRunSocketIoPayload,
    ResourcesReportSocketIoPayload,
    VerifyCurrentStepParams,
    VerifyNowSocketIoPayload,
} from "./types/payload"

/** Pairing code lifetime (ms). After this, `agent:pair` is rejected -- bounds how
 * long a leaked pairing code stays usable (the code is a UUID, so this + the rate
 * limit are defense-in-depth, not the primary guard). */
const PAIRING_CODE_TTL_MS = 30 * 60 * 1000
/** Max `agent:pair` attempts allowed per source IP within {@link PAIR_RATE_WINDOW_SECONDS}. */
const PAIR_RATE_LIMIT = 20
/** Fixed window (seconds) for the per-IP `agent:pair` rate limit (Redis key TTL). */
const PAIR_RATE_WINDOW_SECONDS = 60

@PlaygroundByomWebSocketGateway()
/**
 * WebSocket gateway for the `/playground_byom` namespace -- relays shell
 * commands + resource reports between a browser and a learner's local CLI
 * agent (a plain `socket.io-client` process, connecting OUTBOUND over WSS).
 *
 * Unauthenticated: the agent side has no Keycloak session, so it is gated by
 * a short-lived pairing code (`agent:pair`) instead of a JWT. Once paired,
 * the agent and the observing browser(s) share one room
 * ({@link PlaygroundByomRoomService}); every relay uses `socket.to(room)` (NOT
 * `namespace.to(room)`) so the sender never receives its own echo.
 *
 * Verification is "lite": `resources:report` is checked against the current
 * step's `verifyResourceKind`/`verifyResourceNamePattern`/`verifyExpectedStatus`
 * -- a substring/prefix + optional status match, no AI grading.
 */
export class PlaygroundByomGateway implements OnGatewayDisconnect {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly playgroundByomRoomService: PlaygroundByomRoomService,
        private readonly wsResponseService: WsResponseService,
        // `Cache` ioredis instance -- SHARED across app instances, so the pairing
        // rate limit holds cluster-wide (unlike an in-memory per-instance counter).
        @InjectIoRedis(IoRedisInstanceKey.Cache)
        private readonly redis: Redis,
        private readonly winstonService: WinstonService,
    ) {}

    /** The namespace server instance used to emit to per-session rooms. */
    @WebSocketServer()
    private readonly server: Namespace

    /** sessionId -> the currently-bound agent socket id. Enforces ONE live agent per
     * session: a 2nd concurrent `agent:pair` with the same code (while the first
     * agent is still connected) is rejected, so a leaked code can't attach a rogue
     * agent that spoofs the learner's terminal output / step verification. */
    private readonly boundAgentSocketId = new Map<string, string>()

    /**
     * Records an `agent:pair` attempt from `ip` in Redis (shared across instances)
     * and returns whether it is within the per-IP budget. Fixed window via an atomic
     * INCR + first-hit EXPIRE. Fails OPEN on a Redis blip -- a cache outage must never
     * lock a legit learner out of pairing.
     */
    private async withinPairRateLimit(ip: string): Promise<boolean> {
        try {
            const key = `playground-byom:pair-rate:${ip}`
            const count = await this.redis.incr(key)
            // set the fixed-window TTL only on the first hit; guard a stuck key.
            if (count === 1 || (await this.redis.ttl(key)) < 0) {
                await this.redis.expire(
                    key,
                    PAIR_RATE_WINDOW_SECONDS,
                )
            }
            return count <= PAIR_RATE_LIMIT
        } catch (error) {
            this.winstonService.log(
                WinstonLog.BestEffortOperationFailed,
                {
                    op: "playground-byom.pair-rate-limit",
                    error: error instanceof Error ? error.message : String(error),
                    meta: {
                        ip,
                    },
                },
            )
            return true
        }
    }

    /**
     * Pairs a freshly-started CLI agent with its session: resolves the
     * pairing code, flips `connected = true`, stamps `socket.data.sessionId`,
     * and joins the agent to the session's room. Responds via the Socket.IO
     * ACK callback (NOT a separate emit) so a plain `socket.io-client` caller
     * gets the result as `emit('agent:pair', payload, ack => {...})`.
     *
     * @param payload - Carries the `pairingCode` the learner copied from the browser.
     * @param client - The agent's socket.
     * @param ack - Ack callback: `{ sessionId, playgroundSlug, currentStepIndex }` on
     * success, `{ error }` when the pairing code is invalid/expired.
     */
    @SubscribeMessage(PublicationEvent.PlaygroundAgentPair)
    async handleAgentPair(
        @MessageBody() payload: AgentPairSocketIoPayload,
        @ConnectedSocket() client: TypedSocket,
        @Ack() ack: (response: AgentPairAck) => void,
    ): Promise<void> {
        // (D) throttle the UNAUTHENTICATED pairing endpoint per source IP so the
        // short code can't be brute-forced.
        if (!(await this.withinPairRateLimit(client.handshake.address))) {
            ack({
                error: "Too many attempts — wait a moment and try again.",
            })
            return
        }
        const session = await this.entityManager.findOne(
            PlaygroundSessionEntity,
            {
                where: {
                    pairingCode: payload.pairingCode,
                },
                relations: {
                    playground: true,
                },
            },
        )
        if (!session) {
            ack({
                error: "Invalid or expired pairing code.",
            })
            return
        }
        // (C) reject an expired code -- bounds the window a leaked/guessed code stays usable.
        if (Date.now() - session.createdAt.getTime() > PAIRING_CODE_TTL_MS) {
            ack({
                error: "This pairing code has expired — restart the lab for a new one.",
            })
            return
        }
        // (B) one LIVE agent per session. A reconnect is fine (the old socket's
        // disconnect clears the binding, and a dead socket id is gone from the
        // namespace); a 2nd concurrent agent on the same code is rejected so a
        // rogue agent can't spoof the learner's terminal output / step verification.
        const boundId = this.boundAgentSocketId.get(session.id)
        if (boundId && boundId !== client.id && this.server.sockets.get(boundId)) {
            ack({
                error: "This session already has a connected machine.",
            })
            return
        }
        session.connected = true
        await this.entityManager.save(
            PlaygroundSessionEntity,
            session,
        )
        // bind this socket to the session so later command:output /
        // resources:report handlers can derive the room without the agent
        // having to carry sessionId on every emit
        client.data.sessionId = session.id
        this.boundAgentSocketId.set(session.id,
            client.id)
        await client.join(this.playgroundByomRoomService.name(session.id))
        // tell the observing browser(s) the learner's machine is now paired, so
        // the UI can lift its install-gate. `client.to(room)` excludes the agent.
        client.to(this.playgroundByomRoomService.name(session.id)).emit(
            SubscriptionEvent.PlaygroundAgentConnected,
            {
                connected: true,
            },
        )
        ack({
            sessionId: session.id,
            playgroundSlug: session.playground.slug,
            currentStepIndex: session.currentStepIndex,
        })
    }

    /**
     * Joins the browser to an existing session's room so it receives that
     * session's command output / resource reports / step-verified events.
     *
     * @param payload - Carries the `sessionId` the browser already knows from the route.
     * @param client - The browser's socket.
     */
    @SubscribeMessage(PublicationEvent.PlaygroundBrowserSubscribe)
    async handleBrowserSubscribe(
        @MessageBody() payload: BrowserSubscribeSocketIoPayload,
        @ConnectedSocket() client: TypedSocket,
    ): Promise<void> {
        // load with the owner so we can BOTH seed pairing state AND verify ownership.
        const session = await this.entityManager.findOne(
            PlaygroundSessionEntity,
            {
                where: {
                    id: payload.sessionId,
                },
                relations: {
                    user: true,
                },
            },
        )
        // (A) verify this browser OWNS the session (its Keycloak `sub` matches the
        // owner) and stamp `data.ownedSessionId` -- the flag `command:run` checks so
        // ONLY the owner browser can push commands to the paired agent.
        await this.markOwnerBrowser(client,
            session)
        await client.join(this.playgroundByomRoomService.name(payload.sessionId))
        // seed the freshly-subscribed browser with the CURRENT pairing state --
        // the agent may already have paired before the browser opened, so the UI
        // must not sit on "waiting" forever.
        client.emit(
            session?.connected
                ? SubscriptionEvent.PlaygroundAgentConnected
                : SubscriptionEvent.PlaygroundAgentDisconnected,
            {
                connected: Boolean(session?.connected),
            },
        )
    }

    /**
     * Verifies a browser socket's Keycloak token and, when the token's `sub`
     * matches the session's owner, stamps `data.ownedSessionId` (+ `userId`).
     * Best-effort: a missing/invalid/foreign token just leaves the socket
     * UNMARKED -- it can still observe the room, but `command:run` will reject it.
     */
    private async markOwnerBrowser(
        client: TypedSocket,
        session: PlaygroundSessionEntity | null,
    ): Promise<void> {
        const ownerKeycloakId = session?.user?.keycloakId
        if (!ownerKeycloakId) {
            return
        }
        const token = client.handshake.auth?.token || client.handshake.query?.token
        if (!token || typeof token !== "string") {
            return
        }
        try {
            const keycloakTokenService = globalThis.__APP__.get(
                KeycloakTokenService,
                {
                    strict: false,
                },
            )
            const introspect = await keycloakTokenService.verifyAccessToken(token)
            if (introspect?.active && introspect.sub === ownerKeycloakId) {
                client.data.userId = introspect.sub
                client.data.ownedSessionId = session!.id
            }
        } catch {
            // unverifiable token -> leave unmarked (read-only observer).
        }
    }

    /**
     * A socket dropped. Only the AGENT stamps `data.sessionId` (on pair), so a
     * socket carrying one is the learner's machine leaving: mark the session
     * disconnected and tell the browser room the machine went away (re-gating the
     * UI). A browser drop carries no sessionId -> no-op.
     *
     * @param client - The socket that disconnected.
     */
    async handleDisconnect(
        client: TypedSocket,
    ): Promise<void> {
        const sessionId = client.data.sessionId
        if (!sessionId) {
            return
        }
        const session = await this.entityManager.findOne(
            PlaygroundSessionEntity,
            {
                where: {
                    id: sessionId,
                },
            },
        )
        if (session) {
            session.connected = false
            await this.entityManager.save(
                PlaygroundSessionEntity,
                session,
            )
        }
        // release the single-agent binding so the learner can reconnect (or pair a
        // different machine). Only clear if THIS socket held it.
        if (this.boundAgentSocketId.get(sessionId) === client.id) {
            this.boundAgentSocketId.delete(sessionId)
        }
        // the agent is already gone; broadcast via the namespace to the room.
        this.server.to(this.playgroundByomRoomService.name(sessionId)).emit(
            SubscriptionEvent.PlaygroundAgentDisconnected,
            {
                connected: false,
            },
        )
    }

    /**
     * Relays a shell command from the browser down to the room's paired agent.
     *
     * (A) AUTHORIZATION: only the socket VERIFIED as the session owner on
     * `browser:subscribe` (`data.ownedSessionId === sessionId`) may issue commands.
     * This is the gate that stops a paired agent -- or any other socket that merely
     * guessed the pairing code and learned the `sessionId` -- from relaying a command
     * that the learner's agent would run as an arbitrary shell (RCE).
     *
     * @param payload - Carries the target `sessionId` and the `command` to run.
     * @param client - The browser's socket (excluded from the relay).
     */
    @SubscribeMessage(PublicationEvent.PlaygroundCommandRun)
    handleCommandRun(
        @MessageBody() payload: CommandRunSocketIoPayload,
        @ConnectedSocket() client: TypedSocket,
    ): void {
        if (client.data.ownedSessionId !== payload.sessionId) {
            // not the verified owner browser (an agent, or an unauthorized socket) --
            // never relay a command it could run on the learner's machine.
            this.winstonService.log(
                WinstonLog.BestEffortOperationFailed,
                {
                    op: "playground-byom.command-run.not-owner",
                    sessionId: payload.sessionId,
                    error: "command:run rejected — socket is not the session owner",
                    meta: {
                        socketId: client.id,
                    },
                },
            )
            return
        }
        const room = this.playgroundByomRoomService.name(payload.sessionId)
        // socket.to(room) excludes the sender -- only the paired agent gets this
        client.to(room).emit(
            SubscriptionEvent.PlaygroundCommandRun,
            {
                command: payload.command,
            },
        )
    }

    /**
     * Relays a "verify now" request from the owner browser to the paired agent,
     * which responds by pushing a fresh `resources:report` (so the current step
     * verifies immediately instead of waiting for the next periodic snapshot).
     * Read-only on the agent (just a resource snapshot), but owner-gated for
     * consistency with `command:run`.
     *
     * @param payload - Carries the target `sessionId`.
     * @param client - The browser's socket (excluded from the relay).
     */
    @SubscribeMessage(PublicationEvent.PlaygroundVerifyNow)
    handleVerifyNow(
        @MessageBody() payload: VerifyNowSocketIoPayload,
        @ConnectedSocket() client: TypedSocket,
    ): void {
        if (client.data.ownedSessionId !== payload.sessionId) {
            return
        }
        client.to(this.playgroundByomRoomService.name(payload.sessionId)).emit(
            SubscriptionEvent.PlaygroundVerifyNow,
            {
            },
        )
    }

    /**
     * Relays one chunk of command output from the agent up to the browser room.
     *
     * @param payload - Carries the `output` text (no `sessionId` -- derived from `socket.data.sessionId`).
     * @param client - The agent's socket (excluded from the relay; carries `data.sessionId`).
     */
    @SubscribeMessage(PublicationEvent.PlaygroundCommandOutput)
    handleCommandOutput(
        @MessageBody() payload: CommandOutputSocketIoPayload,
        @ConnectedSocket() client: TypedSocket,
    ): void {
        const sessionId = client.data.sessionId
        if (!sessionId) {
            // agent emitted before pairing -- nothing to relay to
            return
        }
        const room = this.playgroundByomRoomService.name(sessionId)
        client.to(room).emit(
            SubscriptionEvent.PlaygroundCommandOutput,
            {
                output: payload.output,
            },
        )
    }

    /**
     * Relays a browser ping down to the room's agent so the browser can measure
     * round-trip latency to the learner's machine.
     *
     * @param payload - Carries the target `sessionId` and the browser timestamp `t`.
     * @param client - The browser's socket (excluded from the relay).
     */
    @SubscribeMessage(PublicationEvent.PlaygroundAgentPing)
    handleAgentPing(
        @MessageBody() payload: AgentPingSocketIoPayload,
        @ConnectedSocket() client: TypedSocket,
    ): void {
        const room = this.playgroundByomRoomService.name(payload.sessionId)
        client.to(room).emit(
            SubscriptionEvent.PlaygroundAgentPing,
            {
                t: payload.t,
            },
        )
    }

    /**
     * Relays the agent's pong (echoed browser timestamp) back up to the browser
     * room so the browser can compute `Date.now() - t` as the round-trip latency.
     *
     * @param payload - Carries the echoed timestamp `t` (no `sessionId` -- derived from `socket.data.sessionId`).
     * @param client - The agent's socket (excluded from the relay; carries `data.sessionId`).
     */
    @SubscribeMessage(PublicationEvent.PlaygroundAgentPong)
    handleAgentPong(
        @MessageBody() payload: AgentPongSocketIoPayload,
        @ConnectedSocket() client: TypedSocket,
    ): void {
        const sessionId = client.data.sessionId
        if (!sessionId) {
            return
        }
        const room = this.playgroundByomRoomService.name(sessionId)
        client.to(room).emit(
            SubscriptionEvent.PlaygroundAgentPong,
            {
                t: payload.t,
            },
        )
    }

    /**
     * Relays the agent's self-reported resource snapshot to the browser room,
     * then runs the "lite" verify against the session's current step -- on a
     * match, marks the step passed and emits `step:verified`.
     *
     * @param payload - Carries the `resources` list (no `sessionId` -- derived from `socket.data.sessionId`).
     * @param client - The agent's socket (excluded from the relay; carries `data.sessionId`).
     */
    @SubscribeMessage(PublicationEvent.PlaygroundResourcesReport)
    async handleResourcesReport(
        @MessageBody() payload: ResourcesReportSocketIoPayload,
        @ConnectedSocket() client: TypedSocket,
    ): Promise<void> {
        const sessionId = client.data.sessionId
        if (!sessionId) {
            // agent emitted before pairing -- nothing to relay to / verify against
            return
        }
        const room = this.playgroundByomRoomService.name(sessionId)
        client.to(room).emit(
            SubscriptionEvent.PlaygroundResourcesReport,
            {
                resources: payload.resources,
            },
        )
        try {
            await this.verifyCurrentStep({
                sessionId,
                room,
                resources: payload.resources,
            })
        } catch (error) {
            // best-effort: a verify failure must never break the live relay
            this.winstonService.log(
                WinstonLog.BestEffortOperationFailed,
                {
                    op: "playground-byom.verify-current-step",
                    sessionId,
                    error: error instanceof Error ? error.message : String(error),
                },
            )
        }
    }

    /**
     * "Lite" verify: matches the reported resources against the session's
     * current step pattern (kind + name substring/prefix + optional status),
     * no AI grading. On a fresh match, appends the step index to
     * `passedStepIndexes` and emits `step:verified` to the browser room.
     */
    private async verifyCurrentStep(
        {
            sessionId,
            room,
            resources,
        }: VerifyCurrentStepParams,
    ): Promise<void> {
        const session = await this.entityManager.findOne(
            PlaygroundSessionEntity,
            {
                where: {
                    id: sessionId,
                },
            },
        )
        if (!session) {
            return
        }
        // already passed -- nothing to do
        if (session.passedStepIndexes.includes(session.currentStepIndex)) {
            return
        }
        const step = await this.entityManager.findOne(
            PlaygroundStepEntity,
            {
                where: {
                    playground: {
                        id: session.playgroundId,
                    },
                    sortIndex: session.currentStepIndex,
                },
            },
        )
        if (!step) {
            return
        }
        const matched = resources.some(
            (resource) =>
                resource.kind === step.verifyResourceKind
                // an empty pattern matches any name
                && resource.name.includes(step.verifyResourceNamePattern)
                && (
                    step.verifyExpectedStatus === null
                    || resource.status === step.verifyExpectedStatus
                ),
        )
        if (!matched) {
            return
        }
        const passedIndex = session.currentStepIndex
        session.passedStepIndexes = [
            ...session.passedStepIndexes,
            passedIndex,
        ]
        // advance the SERVER-SIDE pointer so the next `resources:report` verifies the
        // NEXT step. Nothing else moves `currentStepIndex` -- without this, verify is
        // pinned to step 0 forever and steps 1..N can never pass.
        session.currentStepIndex = passedIndex + 1
        await this.entityManager.save(
            PlaygroundSessionEntity,
            session,
        )
        this.wsResponseService.successToRoom({
            message: "Playground step verified",
            data: {
                stepIndex: passedIndex,
            },
            room,
            namespace: this.server,
            eventName: SubscriptionEvent.PlaygroundStepVerified,
        })
    }
}
