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
    ContentAiWebSocketGateway,
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
    ContentAiService,
} from "@modules/bussiness"
import {
    AiCeilSurface,
    AiModelCategory,
    AiModelTask,
    ModelProvider,
} from "@modules/databases"
import {
    PublicationEvent,
    SubscriptionEvent,
} from "../enums"
import type {
    AbortContentAiSocketIoPayload,
    AskContentAiSocketIoPayload,
    ContentAiChunkSocketIoMessage,
    EmitChunkParams,
} from "./types"

@ContentAiWebSocketGateway()
/**
 * WebSocket gateway for the `/content_ai` namespace — grounded lesson Q&A
 * answer streaming.
 *
 * The learner emits an {@link PublicationEvent.AskContentAi} with their question
 * (plus recent turns for short-term memory). This gateway grounds the question
 * in the lesson body + enforces the premium gate via {@link ContentAiService},
 * then drives the LangChain `.stream()` through {@link AiInvokeService} on the
 * System engine (floor=free → climb to the tier ceiling, billed by served model
 * like grading — free models = 0),
 * emitting each token delta straight back to the requesting socket as a
 * {@link SubscriptionEvent.ContentAiChunk} event. An
 * {@link PublicationEvent.AbortContentAi} message cancels the in-flight stream.
 */
export class ContentAiGateway {
    constructor(
        private readonly contentAiService: ContentAiService,
        private readonly aiInvokeService: AiInvokeService,
        private readonly aiEntitlementService: AiEntitlementService,
        private readonly wsResponseService: WsResponseService,
    ) {}

    /** The namespace server — used to attach the auth middleware. */
    @WebSocketServer()
    private readonly server: Namespace

    /**
     * Attach the keycloak auth middleware so every connecting socket gets its
     * `client.data.userId` stamped (without it, `handleAskContentAi` fails fast
     * with "not authenticated").
     */
    afterInit() {
        this.server.use(socketIoKeycloakAuthMiddleware)
    }

    /** Logger for stream failures. */
    private readonly logger = new Logger(ContentAiGateway.name)

    /**
     * In-flight stream abort controllers keyed by `{socketId}:{streamId}`. An
     * entry exists only while a question is actively streaming; the
     * `abort-content-ai` handler fires the matching controller to cancel the
     * upstream model request.
     */
    private readonly inFlight = new Map<string, AbortController>()

    /**
     * Answer a content-AI question, streaming the response token-by-token back
     * to the caller. The full answer is never persisted (the conversation is
     * ephemeral, client-side memory).
     *
     * @param client - The asking socket (auth user id on `client.data.userId`).
     * @param payload - The question, content id, recent turns, and stream id.
     */
    @SubscribeMessage(PublicationEvent.AskContentAi)
    async handleAskContentAi(
        @ConnectedSocket() client: TypedSocket,
        @MessageBody() payload: AskContentAiSocketIoPayload,
    ): Promise<void> {
        const {
            streamId,
            sessionId,
            contentId,
            taskId,
            challengeId,
            quizId,
            foundationId,
            courseId,
            question,
            history,
            model,
            provider,
        } = payload.data
        // a pinned model (model + provider) routes to that single model (gated on
        // paid OR enrolled); otherwise the balancer chain. floor stays Free so the
        // chain starts on the 0-credit tier.
        const selection: AiJobSelection | undefined = model && provider
            ? {
                model,
                provider: provider as ModelProvider,
            }
            : undefined
        // the socket stamps the Keycloak subject id; resolve it to the real
        // users.id (uuid) so the premium gate + per-session persistence (which
        // key off enrollments.user_id) match — passing the raw sub would make
        // saveTurn a silent no-op (sessions with 0 saved turns)
        const keycloakId = client.data.userId
        const userId = keycloakId
            ? await this.contentAiService.resolveUserIdByKeycloakId(keycloakId)
            : null
        // an unauthenticated / unresolved socket cannot ground the premium gate
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

        // register an abort controller so `abort-content-ai` can cancel this stream
        const key = this.streamKey(client.id,
            streamId)
        const controller = new AbortController()
        this.inFlight.set(key,
            controller)
        try {
            // ground the question by scope (lesson body + premium gate, or task /
            // foundation RAG) — the service dispatches on which anchor id is present
            const {
                messages,
            } = await this.contentAiService.prepareMessages({
                userId,
                contentId,
                taskId,
                challengeId,
                quizId,
                foundationId,
                courseId,
                question,
                history,
                locale: payload.locale,
            })

            // accumulate the full answer so the completed turn can be persisted
            let answer = ""
            // ONE shared entry — stream on the free floor, climbing to the tier
            // ceiling (local Qwen → OpenRouter free → economy+ only if all free fail)
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
                surface: AiCeilSurface.Chatbot,
                // pin every turn of one conversation to the same provider so the
                // growing history prefix stays a warm cache hit; a lesson-scoped
                // fallback keeps chats without a session id still grouped
                cacheSessionId: sessionId ?? contentId,
                // tutoring answers want a little variety, not deterministic grading
                temperature: 0.3,
                signal: controller.signal,
                onChunk: (delta) => {
                    answer += delta
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

            // bill by the model that actually served — free model = 0 (normal);
            // a climbed economy+ model is charged to the user (platform doesn't eat it)
            await this.aiEntitlementService.consume({
                userId,
                cost,
                surface: AiCeilSurface.Chatbot,
                task: AiModelTask.Chatting,
                model,
                provider,
                promptTokens,
                completionTokens,
                attempts,
            })

            // persist the completed (question → answer) turn under its session —
            // best-effort: a save failure must NOT turn a successful answer into an
            // error for the user. Any scope persists now (content / task / foundation
            // / course); `saveTurn` inherits the session's owner anchor and no-ops
            // when the session is not owned, so a stray/absent sessionId is safe.
            // `contentId` is passed through for the content-scope cross-lesson span
            // and is null on a task/foundation/course turn.
            if (sessionId) {
                try {
                    await this.contentAiService.saveTurn({
                        userId,
                        sessionId,
                        contentId,
                        question,
                        answer,
                    })
                } catch (saveError) {
                    this.logger.error(
                        `content-ai saveTurn ${streamId} failed: ${
                            saveError instanceof Error ? saveError.message : String(saveError)
                        }`,
                    )
                }
            }

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
                `content-ai stream ${streamId} failed: ${message}`,
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
     * Abort an in-flight content-AI answer stream. No-op when the stream is not
     * currently running.
     *
     * @param client - The socket that owns the stream.
     * @param payload - Carries the `streamId` to abort.
     */
    @SubscribeMessage(PublicationEvent.AbortContentAi)
    handleAbortContentAi(
        @ConnectedSocket() client: TypedSocket,
        @MessageBody() payload: AbortContentAiSocketIoPayload,
    ): void {
        const key = this.streamKey(client.id,
            payload.data.streamId)
        // fire the matching controller; the stream loop catches the abort
        const controller = this.inFlight.get(key)
        controller?.abort()
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
        this.wsResponseService.success<ContentAiChunkSocketIoMessage>({
            message: "content ai chunk",
            data,
            client,
            eventName: SubscriptionEvent.ContentAiChunk,
        })
    }
}
