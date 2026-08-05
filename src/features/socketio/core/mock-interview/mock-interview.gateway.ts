import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import {
    ConnectedSocket,
    MessageBody,
    SubscribeMessage,
    WebSocketServer,
} from "@nestjs/websockets"
import {
    Namespace,
} from "socket.io"
import {
    EntityManager,
} from "typeorm"
import {
    MockInterviewWebSocketGateway,
    WsResponseService,
    socketIoKeycloakAuthMiddleware,
} from "@modules/socketio"
import type {
    TypedSocket,
} from "@modules/socketio"
import {
    AiEntitlementService,
} from "@modules/ai/ai-entitlement.service"
import {
    AiInvokeService,
} from "@modules/ai/ai-invoke.service"
import type {
    AiJobSelection,
} from "@modules/ai/types/ai-job-selection"
import {
    UserService,
} from "@modules/bussiness"
import {
    AiCeilSurface,
    AiModelCategory,
    AiModelTask,
    InjectPrimaryPostgreSQLEntityManager,
    ModelProvider,
    MockInterviewPhase,
    MockInterviewSessionEntity,
    MOCK_INTERVIEW_SESSION_DURATION_MS,
    normalizeMockInterviewKind,
    normalizeMockInterviewMode,
} from "@modules/databases"
import {
    PublicationEvent,
    SubscriptionEvent,
} from "../enums"
import {
    MockInterviewTurnService,
} from "./mock-interview-turn.service"
import type {
    AbortMockInterviewTurnSocketIoPayload,
    AskMockInterviewTurnSocketIoPayload,
    EmitChunkParams,
    MockInterviewChunkSocketIoMessage,
    MockInterviewTurnHistoryEntry,
} from "./types"

@MockInterviewWebSocketGateway()
/**
 * WebSocket gateway for the `/mock_interview` namespace -- mock interviewer
 * turn token streaming.
 *
 * The candidate emits an {@link PublicationEvent.AskMockInterviewTurn} carrying
 * the running transcript + current phase; this gateway builds the on-rails,
 * RAG-grounded interviewer prompt via {@link MockInterviewTurnService}, then
 * drives the LangChain `.stream()` through {@link AiInvokeService} on the
 * `Interview` surface (floor=Economy, per the AI-tier grading-floor policy),
 * emitting each token delta straight back to the requesting socket as a
 * {@link SubscriptionEvent.MockInterviewChunk} event. An
 * {@link PublicationEvent.AbortMockInterviewTurn} message cancels the in-flight
 * stream. Mirrors {@link import("../content-ai/content-ai.gateway").ContentAiGateway}
 * almost 1:1 -- the interviewer's turns are ephemeral (never persisted here);
 * only the end-of-session grade (built elsewhere) is durable.
 */
export class MockInterviewGateway {
    constructor(
        private readonly mockInterviewTurnService: MockInterviewTurnService,
        private readonly userService: UserService,
        private readonly aiInvokeService: AiInvokeService,
        private readonly aiEntitlementService: AiEntitlementService,
        private readonly wsResponseService: WsResponseService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly winstonService: WinstonService,
    ) {}

    /** The namespace server -- used to attach the auth middleware. */
    @WebSocketServer()
    private readonly server: Namespace

    /**
     * Attach the keycloak auth middleware so every connecting socket gets its
     * `client.data.userId` stamped (without it, `handleAskMockInterviewTurn`
     * fails fast with "not authenticated").
     */
    afterInit() {
        this.server.use(socketIoKeycloakAuthMiddleware)
    }

    /** In-flight stream abort controllers keyed by `{socketId}:{streamId}`. An
     * entry exists only while a turn is actively streaming; the
     * `abort-mock-interview-turn` handler fires the matching controller to
     * cancel the upstream model request.
     */
    private readonly inFlight = new Map<string, AbortController>()

    /**
     * Ask the interviewer for its next turn, streaming the question
     * token-by-token back to the caller. The turn itself is never persisted
     * here -- only the end-of-session grade (built by a separate flow) is
     * durable; this gateway only ever produces ephemeral interviewer text.
     *
     * @param client - The asking socket (auth user id on `client.data.userId`).
     * @param payload - The course scope, prompt, phase, transcript, and stream id.
     */
    @SubscribeMessage(PublicationEvent.AskMockInterviewTurn)
    async handleAskMockInterviewTurn(
        @ConnectedSocket() client: TypedSocket,
        @MessageBody() payload: AskMockInterviewTurnSocketIoPayload,
    ): Promise<void> {
        const {
            streamId,
            sessionId,
            courseId,
            promptTitle,
            phase,
            history,
            latestAnswer,
            model,
            provider,
            level,
            mode,
            kind,
            currentSeed,
            questionIndex,
        } = payload.data
        // absent/unrecognized mode -> "design" (the pre-existing 5-phase flow),
        // so an FE build that predates the mode split keeps working unchanged
        const normalizedMode = normalizeMockInterviewMode(mode)
        // THIS question's own kind -- meaningful only for mode="qna" (a single
        // qna session mixes kinds across its questions); absent/unrecognized
        // falls back to "theory" (harmless for mode="design", which ignores kind)
        const normalizedKind = normalizeMockInterviewKind(kind)
        // a pinned model (model + provider) routes to that single model (gated on
        // paid OR enrolled); otherwise the balancer chain. floor is set to Economy
        // below (per the interview surface's grading floor), so the chain starts on
        // the cheapest tier that still serves grading.
        const selection: AiJobSelection | undefined = model && provider
            ? {
                model,
                provider: provider as ModelProvider,
            }
            : undefined
        // the socket stamps the Keycloak subject id; resolve it to the real
        // users.id (uuid) so entitlement billing (which keys off users.id)
        // matches -- passing the raw sub would make the entitlement debit a
        // silent mismatch against the wrong row
        const keycloakId = client.data.userId
        const userId = keycloakId
            ? await this.resolveUserId(keycloakId)
            : null
        // an unauthenticated / unresolved socket cannot be billed or graded
        if (!userId) {
            this.emitChunk({
                client,
                data: {
                    streamId,
                    delta: "",
                    done: true,
                    error: "not authenticated",
                },
            })
            return
        }

        // "session time limit" (2026-07-08): enforce the 1-hour ask-loop deadline
        // SERVER-SIDE, anchored to the persisted session's OWN `createdAt` -- never
        // trust a client-side clock. Scoped by ownership (mirrors
        // `syncMockInterviewSessionTurns`'s `enrollment.user.id` scoping) so a
        // sessionId can never be used to probe another learner's draw. Checked
        // BEFORE building the prompt / invoking AI so an expired ask never spends
        // a real AI call.
        const session = await this.entityManager.findOne(
            MockInterviewSessionEntity,
            {
                where: {
                    id: sessionId,
                    enrollment: {
                        user: {
                            id: userId,
                        },
                    },
                },
                select: {
                    id: true,
                    createdAt: true,
                },
            },
        )
        if (!session) {
            this.emitChunk({
                client,
                data: {
                    streamId,
                    delta: "",
                    done: true,
                    error: "session not found",
                },
            })
            return
        }
        if (Date.now() - session.createdAt.getTime() > MOCK_INTERVIEW_SESSION_DURATION_MS) {
            this.emitChunk({
                client,
                data: {
                    streamId,
                    delta: "",
                    done: true,
                    error: "SESSION_EXPIRED",
                },
            })
            return
        }

        // register an abort controller so `abort-mock-interview-turn` can cancel this stream
        const key = this.streamKey(client.id,
            streamId)
        const controller = new AbortController()
        this.inFlight.set(key,
            controller)
        try {
            // normalize the wire-format transcript into the strict role union
            // the prompt builder expects -- any unexpected role string collapses
            // to "candidate" so a malformed client payload never throws here
            const normalizedHistory: Array<MockInterviewTurnHistoryEntry> = (history ?? []).map(
                (entry) => ({
                    role: entry.role === "interviewer" ? "interviewer" : "candidate",
                    content: entry.content,
                }),
            )

            // build the on-rails, RAG-grounded interviewer prompt for this turn --
            // branches internally on mode (design's 5-phase flow vs the qna
            // mode's N-question flow, where each question reads its OWN kind)
            const {
                messages,
            } = await this.mockInterviewTurnService.prepareTurn({
                courseId,
                promptTitle,
                mode: normalizedMode,
                kind: normalizedKind,
                // the wire payload carries the phase as a plain string; cast
                // through the enum since the FE only ever sends a valid value
                // (meaningful only for mode="design" -- ignored otherwise)
                phase: phase as MockInterviewPhase,
                currentSeed,
                questionIndex,
                history: normalizedHistory,
                latestAnswer,
                locale: payload.locale,
                level,
            })

            // ONE shared entry -- stream on the Economy floor (mock-interview
            // grading floor policy), climbing to the tier ceiling for the
            // Interview surface
            const {
                model,
                provider,
                cost,
                promptTokens,
                completionTokens,
                attempts,
            } = await this.aiInvokeService.run({
                userId,
                messages,
                selection,
                floor: AiModelCategory.Low,
                surface: AiCeilSurface.Interview,
                // interviewer questions want natural variety, not deterministic grading
                temperature: 0.4,
                signal: controller.signal,
                onChunk: (delta) => {
                    this.emitChunk({
                        client,
                        data: {
                            streamId,
                            delta,
                            done: false,
                        },
                    })
                },
            })

            // bill by the model that actually served this turn
            await this.aiEntitlementService.consume({
                userId,
                cost,
                surface: AiCeilSurface.Interview,
                task: AiModelTask.Chatting,
                model,
                provider,
                promptTokens,
                completionTokens,
                attempts,
            })

            // terminal chunk: no new text, just the done flag
            this.emitChunk({
                client,
                data: {
                    streamId,
                    delta: "",
                    done: true,
                },
            })
        } catch (error) {
            // any failure (including abort) -> terminal chunk carrying the error
            const message = error instanceof Error
                ? error.message
                : String(error)
            this.winstonService.log(
                WinstonLog.RealtimeStreamFailed,
                {
                    op: "mock-interview.stream",
                    userId,
                    sessionId,
                    error: message,
                    meta: {
                        streamId,
                    },
                },
            )
            this.emitChunk({
                client,
                data: {
                    streamId,
                    delta: "",
                    done: true,
                    error: message,
                },
            })
        } finally {
            // the stream is no longer in flight -- drop the abort controller
            this.inFlight.delete(key)
        }
    }

    /**
     * Abort an in-flight interviewer turn stream. No-op when the stream is
     * not currently running.
     *
     * @param client - The socket that owns the stream.
     * @param payload - Carries the `streamId` to abort.
     */
    @SubscribeMessage(PublicationEvent.AbortMockInterviewTurn)
    handleAbortMockInterviewTurn(
        @ConnectedSocket() client: TypedSocket,
        @MessageBody() payload: AbortMockInterviewTurnSocketIoPayload,
    ): void {
        const key = this.streamKey(client.id,
            payload.data.streamId)
        // fire the matching controller; the stream loop catches the abort
        const controller = this.inFlight.get(key)
        controller?.abort()
    }

    /**
     * Resolve a Keycloak subject id to the real `users.id` (uuid), swallowing
     * the "not found" failure into `null` -- `UserService.getUserByKeycloakId`
     * throws rather than returning nullish, so this boundary normalizes that
     * into the same "unresolved -> null" shape `ContentAiService` exposes.
     *
     * @param keycloakId - The Keycloak subject id from the socket.
     * @returns The real user id, or `null` when no user matches.
     */
    private async resolveUserId(
        keycloakId: string,
    ): Promise<string | null> {
        try {
            const user = await this.userService.getUserByKeycloakId(keycloakId)
            return user?.id ?? null
        } catch {
            // no matching user row -- treat exactly like an unresolved id
            return null
        }
    }

    /**
     * Deterministic in-flight map key for one socket's one stream.
     *
     * @param socketId - The socket id.
     * @param streamId - The client-generated stream id.
     * @returns The composite key.
     */
    private streamKey(
        socketId: string,
        streamId: string,
    ): string {
        return `${socketId}:${streamId}`
    }

    /**
     * Emit one chunk message back to the requesting client.
     *
     * @param params - The target client and the chunk payload.
     */
    private emitChunk(
        {
            client,
            data,
        }: EmitChunkParams,
    ): void {
        this.wsResponseService.success<MockInterviewChunkSocketIoMessage>({
            message: "mock interview chunk",
            data,
            client,
            eventName: SubscriptionEvent.MockInterviewChunk,
        })
    }
}
