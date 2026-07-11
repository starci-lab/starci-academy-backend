import {
    Logger,
} from "@nestjs/common"
import {
    Ack,
    ConnectedSocket,
    MessageBody,
    SubscribeMessage,
    WebSocketServer,
} from "@nestjs/websockets"
import type {
    Namespace,
} from "socket.io"
import {
    PlaygroundByomWebSocketGateway,
    WsResponseService,
} from "@modules/socketio"
import type {
    TypedSocket,
} from "@modules/socketio"
import {
    type EntityManager,
} from "typeorm"
import {
    InjectPrimaryPostgreSQLEntityManager,
    PlaygroundSessionEntity,
    PlaygroundStepEntity,
} from "@modules/databases"
import {
    PublicationEvent,
    SubscriptionEvent,
} from "../enums"
import {
    PlaygroundByomRoomService,
} from "./playground-byom-room.service"
import type {
    AgentPairAck,
    AgentPairSocketIoPayload,
    BrowserSubscribeSocketIoPayload,
    CommandOutputSocketIoPayload,
    CommandRunSocketIoPayload,
    ResourcesReportSocketIoPayload,
} from "./types"

/**
 * WebSocket gateway for the `/playground_byom` namespace — relays shell
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
 * — a substring/prefix + optional status match, no AI grading.
 */
@PlaygroundByomWebSocketGateway()
export class PlaygroundByomGateway {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly playgroundByomRoomService: PlaygroundByomRoomService,
        private readonly wsResponseService: WsResponseService,
    ) {}

    /** The namespace server instance used to emit to per-session rooms. */
    @WebSocketServer()
    private readonly server: Namespace

    /** Logger for best-effort verify failures (never fatal to the relay). */
    private readonly logger = new Logger(PlaygroundByomGateway.name)

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
        session.connected = true
        await this.entityManager.save(
            PlaygroundSessionEntity,
            session,
        )
        // bind this socket to the session so later command:output /
        // resources:report handlers can derive the room without the agent
        // having to carry sessionId on every emit
        client.data.sessionId = session.id
        await client.join(this.playgroundByomRoomService.name(session.id))
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
        await client.join(this.playgroundByomRoomService.name(payload.sessionId))
    }

    /**
     * Relays a shell command from the browser down to the room's paired agent.
     *
     * @param payload - Carries the target `sessionId` and the `command` to run.
     * @param client - The browser's socket (excluded from the relay).
     */
    @SubscribeMessage(PublicationEvent.PlaygroundCommandRun)
    handleCommandRun(
        @MessageBody() payload: CommandRunSocketIoPayload,
        @ConnectedSocket() client: TypedSocket,
    ): void {
        const room = this.playgroundByomRoomService.name(payload.sessionId)
        // socket.to(room) excludes the sender — only the paired agent gets this
        client.to(room).emit(
            SubscriptionEvent.PlaygroundCommandRun,
            {
                command: payload.command,
            },
        )
    }

    /**
     * Relays one chunk of command output from the agent up to the browser room.
     *
     * @param payload - Carries the `output` text (no `sessionId` — derived from `socket.data.sessionId`).
     * @param client - The agent's socket (excluded from the relay; carries `data.sessionId`).
     */
    @SubscribeMessage(PublicationEvent.PlaygroundCommandOutput)
    handleCommandOutput(
        @MessageBody() payload: CommandOutputSocketIoPayload,
        @ConnectedSocket() client: TypedSocket,
    ): void {
        const sessionId = client.data.sessionId
        if (!sessionId) {
            // agent emitted before pairing — nothing to relay to
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
     * Relays the agent's self-reported resource snapshot to the browser room,
     * then runs the "lite" verify against the session's current step — on a
     * match, marks the step passed and emits `step:verified`.
     *
     * @param payload - Carries the `resources` list (no `sessionId` — derived from `socket.data.sessionId`).
     * @param client - The agent's socket (excluded from the relay; carries `data.sessionId`).
     */
    @SubscribeMessage(PublicationEvent.PlaygroundResourcesReport)
    async handleResourcesReport(
        @MessageBody() payload: ResourcesReportSocketIoPayload,
        @ConnectedSocket() client: TypedSocket,
    ): Promise<void> {
        const sessionId = client.data.sessionId
        if (!sessionId) {
            // agent emitted before pairing — nothing to relay to / verify against
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
            this.logger.error(
                `resources:report verify failed for session ${sessionId}: ${
                    error instanceof Error ? error.message : String(error)
                }`,
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
        }: {
            sessionId: string
            room: string
            resources: ResourcesReportSocketIoPayload["resources"]
        },
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
        // already passed — nothing to do
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
        session.passedStepIndexes = [
            ...session.passedStepIndexes,
            session.currentStepIndex,
        ]
        await this.entityManager.save(
            PlaygroundSessionEntity,
            session,
        )
        this.wsResponseService.successToRoom({
            message: "Playground step verified",
            data: {
                stepIndex: session.currentStepIndex,
            },
            room,
            namespace: this.server,
            eventName: SubscriptionEvent.PlaygroundStepVerified,
        })
    }
}
