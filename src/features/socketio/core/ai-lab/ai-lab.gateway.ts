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
    AiLabWebSocketGateway,
    WsResponseService,
} from "@modules/socketio"
import type {
    TypedSocket,
} from "@modules/socketio"
import {
    AiInvokeService,
} from "@modules/ai"
import {
    AiLabRunService,
} from "@modules/bussiness"
import {
    AiLabRunStatus,
    AiModelTask,
} from "@modules/databases"
import {
    PublicationEvent,
    SubscriptionEvent,
} from "../enums"
import {
    AiLabRunRoomService,
} from "./ai-lab-run-room.service"
import type {
    AbortAiLabRunSocketIoPayload,
    AiLabRunChunkSocketIoMessage,
    SubscribeAiLabRunSocketIoPayload,
} from "./types"

/**
 * WebSocket gateway for the `/ai_lab` namespace — playground prompt streaming.
 *
 * A learner first creates a run via the `runPlaygroundPrompt` mutation (which
 * gates entitlement and persists a `Streaming` row), then subscribes here with
 * the returned `runId`. This gateway joins the per-run room, drives the
 * LangChain `.stream()` through {@link AiLabRunService}/{@link AiInvokeService},
 * and emits each token delta as an {@link SubscriptionEvent.AiLabRunChunk}
 * event into room `ai-lab-run:{runId}`. A cache hit emits a single final chunk
 * with `status: Cached` and never calls the model. An `abort-ai-lab-run`
 * message cancels the in-flight stream and flips the run to `Failed`.
 */
@AiLabWebSocketGateway()
export class AiLabGateway {
    constructor(
        private readonly aiLabRunService: AiLabRunService,
        private readonly aiInvokeService: AiInvokeService,
        private readonly aiLabRunRoomService: AiLabRunRoomService,
        private readonly wsResponseService: WsResponseService,
    ) {}

    /** The namespace server instance used to emit to per-run rooms. */
    @WebSocketServer()
    private readonly server: Namespace

    /** Logger for stream failures that cannot be persisted on the run row. */
    private readonly logger = new Logger(AiLabGateway.name)

    /**
     * In-flight stream abort controllers keyed by run id. An entry exists only
     * while a run is actively streaming; the `abort-ai-lab-run` handler fires
     * the matching controller to cancel the upstream model request.
     */
    private readonly inFlight = new Map<string, AbortController>()

    /**
     * Join the run's room and start streaming its tokens to the caller.
     *
     * Fresh runs are streamed token-by-token; cache hits emit one final chunk
     * with the stored output. The full output + token usage are persisted once
     * the stream finishes via {@link AiLabRunService.persistRunOutput}.
     *
     * @param client - The subscribing socket (joined to the run room).
     * @param payload - Carries the `runId` to subscribe to.
     */
    @SubscribeMessage(PublicationEvent.SubscribeAiLabRun)
    async handleSubscribeAiLabRun(
        @ConnectedSocket() client: TypedSocket,
        @MessageBody() payload: SubscribeAiLabRunSocketIoPayload,
    ): Promise<void> {
        const {
            runId,
        } = payload.data
        // join the per-run room so this socket receives the run's chunk events
        const room = this.aiLabRunRoomService.name(runId)
        await client.join(room)

        // resolve the run: messages + invoke options for a fresh run, or the
        // stored output for a cache hit (which short-circuits the model call)
        const prepared = await this.aiLabRunService.prepareStream({
            runId,
        })

        // cache hit → emit the full stored output as a single final chunk; done
        if (prepared.status === AiLabRunStatus.Cached) {
            this.emitChunk({
                room,
                data: {
                    runId,
                    delta: prepared.cachedOutput ?? "",
                    done: true,
                    status: AiLabRunStatus.Cached,
                },
            })
            return
        }

        // a fresh run must carry resolved invoke options (createRun set them)
        if (!prepared.invokeOptions) {
            // defensive: nothing to stream and not a cache hit → mark failed + notify
            await this.failRun({
                runId,
                room,
                errorMessage: "run has no resolved invoke options to stream",
            })
            return
        }

        // register an abort controller so `abort-ai-lab-run` can cancel this stream
        const controller = new AbortController()
        this.inFlight.set(runId,
            controller)
        try {
            // drive the LangChain stream; emit every token delta into the run room
            const result = await this.aiInvokeService.stream({
                messages: prepared.messages,
                category: prepared.invokeOptions.category,
                model: prepared.invokeOptions.model,
                provider: prepared.invokeOptions.provider,
                task: AiModelTask.Chatting,
                // playground generations want some variety, not deterministic grading
                temperature: 0.7,
                signal: controller.signal,
                onChunk: (delta) => {
                    this.emitChunk({
                        room,
                        data: {
                            runId,
                            delta,
                            done: false,
                            status: AiLabRunStatus.Streaming,
                        },
                    })
                },
            })

            // persist the full output + observed token usage and flip to Completed
            await this.aiLabRunService.persistRunOutput({
                runId,
                output: result.text,
                model: result.model,
                provider: result.provider,
                promptTokens: result.promptTokens,
                completionTokens: result.completionTokens,
            })

            // terminal chunk: no new text, just the done flag + final token counts
            this.emitChunk({
                room,
                data: {
                    runId,
                    delta: "",
                    done: true,
                    status: AiLabRunStatus.Completed,
                    promptTokens: result.promptTokens,
                    completionTokens: result.completionTokens,
                },
            })
        } catch (error) {
            // any stream failure (including abort) → mark the run failed + notify the room
            const message = error instanceof Error
                ? error.message
                : String(error)
            await this.failRun({
                runId,
                room,
                errorMessage: message,
            })
        } finally {
            // the stream is no longer in flight — drop the abort controller
            this.inFlight.delete(runId)
        }
    }

    /**
     * Abort an in-flight run stream: cancel the upstream model request and flip
     * the run to `Failed`. No-op when the run is not currently streaming.
     *
     * @param payload - Carries the `runId` to abort.
     */
    @SubscribeMessage(PublicationEvent.AbortAiLabRun)
    handleAbortAiLabRun(
        @MessageBody() payload: AbortAiLabRunSocketIoPayload,
    ): void {
        const {
            runId,
        } = payload.data
        // fire the matching controller; the stream loop catches the abort and
        // marks the run failed in its catch block, so nothing else to do here
        const controller = this.inFlight.get(runId)
        controller?.abort()
    }

    /**
     * Mark a run failed and emit a terminal failed chunk to its room.
     *
     * @param params - The run id, its room, and the failure reason.
     */
    private async failRun(
        {
            runId,
            room,
            errorMessage,
        }: {
            runId: string
            room: string
            errorMessage: string
        },
    ): Promise<void> {
        // best-effort persist; if even this fails, log and still notify the room
        try {
            await this.aiLabRunService.markRunFailed({
                runId,
                errorMessage,
            })
        } catch (error) {
            // could not even persist the failed status — log and still notify the room
            this.logger.error(
                `failed to mark AI Lab run ${runId} as failed: ${
                    error instanceof Error ? error.message : String(error)
                }`,
            )
        }
        // terminal failed chunk so the FE stops its spinner / shows the error
        this.emitChunk({
            room,
            data: {
                runId,
                delta: "",
                done: true,
                status: AiLabRunStatus.Failed,
            },
        })
    }

    /**
     * Emit one run-chunk message to a run room under the chunk subscription event.
     *
     * @param params - The target room and the chunk payload.
     */
    private emitChunk(
        {
            room,
            data,
        }: {
            room: string
            data: AiLabRunChunkSocketIoMessage
        },
    ): void {
        // every chunk shares the same event + room targeting
        this.wsResponseService.successToRoom<AiLabRunChunkSocketIoMessage>({
            message: "AI Lab run chunk",
            data,
            room,
            namespace: this.server,
            eventName: SubscriptionEvent.AiLabRunChunk,
        })
    }
}
