import {
    Logger,
} from "@nestjs/common"
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
    MockInterviewWebSocketGateway,
    WsResponseService,
    socketIoKeycloakAuthMiddleware,
} from "@modules/socketio"
import type {
    TypedSocket,
} from "@modules/socketio"
import {
    AiEntitlementService,
    AiInvokeService,
} from "@modules/ai"
import type {
    AiJobSelection,
} from "@modules/ai"
import {
    UserService,
} from "@modules/bussiness"
import {
    AiCeilSurface,
    AiMode,
    AiModelCategory,
    AiModelTask,
    ModelProvider,
    MockInterviewPhase,
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
    MockInterviewChunkSocketIoMessage,
    MockInterviewTurnHistoryEntry,
} from "./types"

/**
 * WebSocket gateway for the `/mock_interview` namespace — mock interviewer
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
 * almost 1:1 — the interviewer's turns are ephemeral (never persisted here);
 * only the end-of-session grade (built elsewhere) is durable.
 */
@MockInterviewWebSocketGateway()
export class MockInterviewGateway {
    constructor(
        private readonly mockInterviewTurnService: MockInterviewTurnService,
        private readonly userService: UserService,
        private readonly aiInvokeService: AiInvokeService,
        private readonly aiEntitlementService: AiEntitlementService,
        private readonly wsResponseService: WsResponseService,
    ) {}

    /** The namespace server — used to attach the auth middleware. */
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

    /** Logger for stream failures. */
    private readonly logger = new Logger(MockInterviewGateway.name)

    /**
     * In-flight stream abort controllers keyed by `{socketId}:{streamId}`. An
     * entry exists only while a turn is actively streaming; the
     * `abort-mock-interview-turn` handler fires the matching controller to
     * cancel the upstream model request.
     */
    private readonly inFlight = new Map<string, AbortController>()

    /**
     * Ask the interviewer for its next turn, streaming the question
     * token-by-token back to the caller. The turn itself is never persisted
     * here — only the end-of-session grade (built by a separate flow) is
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
            courseId,
            promptTitle,
            phase,
            history,
            latestAnswer,
            mode,
            model,
            provider,
        } = payload.data
        // a pinned model (mode "premium" + model + provider) routes Premium
        // (gated on paid OR enrolled); otherwise the free/economy Auto chain.
        // floor is set to Economy below (per the interview surface's grading
        // floor), so Auto starts on the cheapest tier that still serves grading.
        const selection: AiJobSelection | undefined = mode === AiMode.Premium
            && model
            && provider
            ? {
                mode: AiMode.Premium,
                model,
                provider: provider as ModelProvider,
            }
            : undefined
        // the socket stamps the Keycloak subject id; resolve it to the real
        // users.id (uuid) so entitlement billing (which keys off users.id)
        // matches — passing the raw sub would make the entitlement debit a
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

        // register an abort controller so `abort-mock-interview-turn` can cancel this stream
        const key = this.streamKey(client.id,
            streamId)
        const controller = new AbortController()
        this.inFlight.set(key,
            controller)
        try {
            // normalize the wire-format transcript into the strict role union
            // the prompt builder expects — any unexpected role string collapses
            // to "candidate" so a malformed client payload never throws here
            const normalizedHistory: Array<MockInterviewTurnHistoryEntry> = (history ?? []).map(
                (entry) => ({
                    role: entry.role === "interviewer" ? "interviewer" : "candidate",
                    content: entry.content,
                }),
            )

            // build the on-rails, RAG-grounded interviewer prompt for this turn
            const {
                messages,
            } = await this.mockInterviewTurnService.prepareTurn({
                courseId,
                promptTitle,
                // the wire payload carries the phase as a plain string; cast
                // through the enum since the FE only ever sends a valid value
                phase: phase as MockInterviewPhase,
                history: normalizedHistory,
                latestAnswer,
                locale: payload.locale,
            })

            // ONE shared entry — stream on the Economy floor (mock-interview
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
                floor: AiModelCategory.Economy,
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
                mode: AiMode.Auto,
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
            // any failure (including abort) → terminal chunk carrying the error
            const message = error instanceof Error
                ? error.message
                : String(error)
            this.logger.error(
                `mock-interview stream ${streamId} failed: ${message}`,
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
            // the stream is no longer in flight — drop the abort controller
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
     * the "not found" failure into `null` — `UserService.getUserByKeycloakId`
     * throws rather than returning nullish, so this boundary normalizes that
     * into the same "unresolved → null" shape `ContentAiService` exposes.
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
            // no matching user row — treat exactly like an unresolved id
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
        }: {
            client: TypedSocket
            data: MockInterviewChunkSocketIoMessage
        },
    ): void {
        this.wsResponseService.success<MockInterviewChunkSocketIoMessage>({
            message: "mock interview chunk",
            data,
            client,
            eventName: SubscriptionEvent.MockInterviewChunk,
        })
    }
}
