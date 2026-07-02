import {
    Logger,
} from "@nestjs/common"
import {
    ConnectedSocket,
    MessageBody,
    SubscribeMessage,
    WebSocketServer,
} from "@nestjs/websockets"
import type {
    Namespace,
} from "socket.io"
import {
    RagPlaygroundWebSocketGateway,
    WsResponseService,
} from "@modules/socketio"
import type {
    TypedSocket,
} from "@modules/socketio"
import {
    AiInvokeService,
} from "@modules/ai"
import {
    AiModelCategory,
    AiModelTask,
} from "@modules/databases"
import {
    RagPlaygroundRunRegistryService,
} from "@modules/rag"
import {
    PublicationEvent,
    SubscriptionEvent,
} from "../enums"
import type {
    AbortRagPlaygroundRunSocketIoPayload,
    RagPlaygroundRunChunkSocketIoMessage,
    SubscribeRagPlaygroundRunSocketIoPayload,
} from "./types"

/**
 * WebSocket gateway for the `/rag_playground` namespace — PUBLIC, no auth
 * (anonymous marketing demo). Mirrors `/ai_lab` (per-run room + token-delta
 * streaming) with two deliberate differences:
 *
 * - The run is prepared by the `askRagPlayground` MUTATION (retrieval + prompt
 *   build), not persisted — {@link RagPlaygroundRunRegistryService} hands it
 *   over here as a single-use in-memory entry, consumed on subscribe.
 * - The model call is invoked via {@link AiInvokeService.stream} DIRECTLY with
 *   `categories: [Free]` — bypassing {@link AiInvokeService.run}'s userId /
 *   entitlement resolution entirely (there is no user here). This hard-pins
 *   the $0 self-hosted local model and never climbs to a paid tier, so the
 *   "chạy trên GPU local · miễn phí" claim on the marketing page always holds.
 */
@RagPlaygroundWebSocketGateway()
export class RagPlaygroundGateway {
    constructor(
        private readonly ragPlaygroundRunRegistryService: RagPlaygroundRunRegistryService,
        private readonly aiInvokeService: AiInvokeService,
        private readonly wsResponseService: WsResponseService,
    ) {}

    /** The namespace server instance used to emit to per-run rooms. */
    @WebSocketServer()
    private readonly server: Namespace

    /** Logger for stream failures (nothing to persist here — best-effort only). */
    private readonly logger = new Logger(RagPlaygroundGateway.name)

    /** In-flight abort controllers keyed by run id, mirrors the AI Lab gateway. */
    private readonly inFlight = new Map<string, AbortController>()

    /**
     * Join the run's room and stream its tokens from the LOCAL model.
     *
     * @param client - The subscribing socket (joined to the run room).
     * @param payload - Carries the `runId` returned by `askRagPlayground`.
     */
    @SubscribeMessage(PublicationEvent.SubscribeRagPlaygroundRun)
    async handleSubscribeRagPlaygroundRun(
        @ConnectedSocket() client: TypedSocket,
        @MessageBody() payload: SubscribeRagPlaygroundRunSocketIoPayload,
    ): Promise<void> {
        const {
            runId,
        } = payload.data
        const room = this.roomName(runId)
        await client.join(room)

        // single-use: a run not consumed here (expired / never asked / already
        // streamed) has nothing to send
        const prepared = this.ragPlaygroundRunRegistryService.consume(runId)
        if (!prepared) {
            this.emitChunk({
                room,
                data: {
                    runId,
                    delta: "",
                    done: true,
                    error: "Phiên hỏi đã hết hạn, hãy đặt lại câu hỏi.",
                },
            })
            return
        }

        const controller = new AbortController()
        this.inFlight.set(runId,
            controller)
        try {
            const result = await this.aiInvokeService.stream({
                messages: prepared.messages,
                // hard-pinned Free (local model) — no userId, no entitlement, no
                // climbing to a paid tier. If the local host is down this simply
                // fails (caught below), which is the correct behavior here.
                categories: [
                    AiModelCategory.Free,
                ],
                task: AiModelTask.Chatting,
                temperature: 0.3,
                signal: controller.signal,
                onChunk: (delta) => {
                    this.emitChunk({
                        room,
                        data: {
                            runId,
                            delta,
                            done: false,
                        },
                    })
                },
            })
            this.emitChunk({
                room,
                data: {
                    runId,
                    delta: "",
                    done: true,
                    sources: prepared.sources,
                },
            })
            // best-effort observability only — no cost, no user to bill
            this.logger.debug(
                `RAG Playground run ${runId} served by ${result.provider}/${result.model}`,
            )
        } catch (error) {
            const message = error instanceof Error
                ? error.message
                : String(error)
            this.logger.warn(
                `RAG Playground run ${runId} failed: ${message}`,
            )
            this.emitChunk({
                room,
                data: {
                    runId,
                    delta: "",
                    done: true,
                    sources: prepared.sources,
                    error: "AI hiện không khả dụng, thử lại sau.",
                },
            })
        } finally {
            this.inFlight.delete(runId)
        }
    }

    /**
     * Abort an in-flight run stream. No-op when the run is not currently streaming.
     *
     * @param payload - Carries the `runId` to abort.
     */
    @SubscribeMessage(PublicationEvent.AbortRagPlaygroundRun)
    handleAbortRagPlaygroundRun(
        @MessageBody() payload: AbortRagPlaygroundRunSocketIoPayload,
    ): void {
        const {
            runId,
        } = payload.data
        const controller = this.inFlight.get(runId)
        controller?.abort()
    }

    /** Deterministic room name for one RAG Playground run's token stream. */
    private roomName(
        runId: string,
    ): string {
        return `rag-playground-run:${runId}`
    }

    /**
     * Emit one run-chunk message to a run room under the chunk subscription event.
     */
    private emitChunk(
        {
            room,
            data,
        }: {
            room: string
            data: RagPlaygroundRunChunkSocketIoMessage
        },
    ): void {
        this.wsResponseService.successToRoom<RagPlaygroundRunChunkSocketIoMessage>({
            message: "RAG Playground run chunk",
            data,
            room,
            namespace: this.server,
            eventName: SubscriptionEvent.RagPlaygroundRunChunk,
        })
    }
}
