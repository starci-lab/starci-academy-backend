import {
    createHash 
} from "node:crypto"
import {
    WinstonLog 
} from "@modules/platform/winston/enums/winston-log"
import {
    WinstonService 
} from "@modules/platform/winston/winston.service"
import {
    ConnectedSocket,
    MessageBody,
    SubscribeMessage,
    WebSocketServer,
} from "@nestjs/websockets"
import {
    Namespace 
} from "socket.io"
import {
    ContentAiWebSocketGateway 
} from "@modules/platform/socketio/decorators/gateway"
import {
    socketIoKeycloakAuthMiddleware 
} from "@modules/platform/socketio/middlewares/keycloak-auth"
import {
    WsResponseService 
} from "@modules/platform/socketio/response.service"
import type {
    TypedSocket 
} from "@modules/platform/socketio/types/socket"
import {
    AiEntitlementService 
} from "@modules/ai/ai-entitlement.service"
import {
    AiInvokeService 
} from "@modules/ai/ai-invoke.service"
import type {
    AiJobSelection 
} from "@modules/ai/types/ai-job-selection"
import {
    ContentAiService 
} from "@modules/bussiness/content-ai/content-ai.service"
import {
    AiCeilSurface 
} from "@modules/databases/postgresql/primary/enums/ai-ceil-surface"
import {
    AiModelCategory 
} from "@modules/databases/postgresql/primary/enums/ai-model-category"
import {
    AiModelTask 
} from "@modules/databases/postgresql/primary/enums/ai-model-task"
import {
    ModelProvider 
} from "@modules/databases/postgresql/primary/enums/model-provider"
import {
    PublicationEvent 
} from "../enums/publication-event"
import {
    SubscriptionEvent 
} from "../enums/subscription-event"
import type {
    ContentAiChunkSocketIoMessage,
    EmitChunkParams,
} from "./types/message"
import type {
    AbortContentAiSocketIoPayload,
    AskContentAiSocketIoPayload,
} from "./types/payload"

@ContentAiWebSocketGateway()
/**
 * WebSocket gateway for the `/content_ai` namespace -- grounded lesson Q&A
 * answer streaming.
 *
 * The learner emits an {@link PublicationEvent.AskContentAi} with their question
 * (plus recent turns for short-term memory). This gateway grounds the question
 * in the lesson body + enforces the premium gate via {@link ContentAiService},
 * then drives the LangChain `.stream()` through {@link AiInvokeService} on the
 * System engine (floor=free -> climb to the tier ceiling, billed by served model
 * like grading -- free models = 0),
 * buffering the winning attempt until its charge and completed-turn write
 * succeed, then flushing its deltas to the requesting socket as
 * {@link SubscriptionEvent.ContentAiChunk} events. An
 * {@link PublicationEvent.AbortContentAi} message cancels the in-flight stream.
 */
export class ContentAiGateway {
    constructor(
    private readonly contentAiService: ContentAiService,
    private readonly aiInvokeService: AiInvokeService,
    private readonly aiEntitlementService: AiEntitlementService,
    private readonly wsResponseService: WsResponseService,
    private readonly winstonService: WinstonService,
    ) {}

  /** The namespace server -- used to attach the auth middleware. */
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

  /** In-flight stream abort controllers keyed by `{socketId}:{streamId}`. An
   * entry exists only while a question is actively streaming; the
   * `abort-content-ai` handler fires the matching controller to cancel the
   * upstream model request.
   */
  private readonly inFlight = new Map<string, AbortController>()

  /**
   * Answer a content-AI question and flush the winning response after its
   * charge and completed-turn persistence succeed.
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
          experience,
          selectedText,
          question,
          history,
          model,
          provider,
      } = payload.data
      // a pinned model (model + provider) routes to that single model (gated on
      // paid OR enrolled); otherwise the balancer chain. floor stays Free so the
      // chain starts on the 0-credit tier.
      const selection: AiJobSelection | undefined =
      model && provider
          ? {
              model,
              provider: provider as ModelProvider,
          }
          : undefined
      // the socket stamps the Keycloak subject id; resolve it to the real
      // users.id (uuid) so the premium gate + per-session persistence (which
      // key off enrollments.user_id) match -- passing the raw sub would make
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

      const requestHash = this.requestHash(payload)
      const boundedSelection = selectedText?.trim() ?? ""
      if (boundedSelection.length > 6_000) {
          this.emitChunk({
              client,
              data: {
                  streamId,
                  delta: "",
                  done: true,
                  error: "selected text is too long",
              },
          })
          return
      }
      const groundedQuestion = boundedSelection
          ? `${question}\n\n=== SELECTED PASSAGE ===\n${boundedSelection}`
          : question
      const key = this.streamKey(client.id,
          streamId)
      let controller: AbortController | null = null
      let durableTurnAcquired = false
      let groundingCourseId = courseId
      try {
          if (sessionId) {
              const claim = await this.contentAiService.acquireTurn({
                  userId,
                  sessionId,
                  streamId,
                  requestHash,
                  contentId,
                  taskId,
                  challengeId,
                  quizId,
                  courseId,
                  experience,
              })
              if (claim.outcome === "replay") {
                  if (claim.answer) {
                      this.emitChunk({
                          client,
                          data: {
                              streamId,
                              delta: claim.answer,
                              done: false,
                          },
                      })
                  }
                  this.emitChunk({
                      client,
                      data: {
                          streamId,
                          delta: "",
                          done: true,
                      },
                  })
                  return
              }
              const claimErrors = {
                  "in-progress": "content ai turn already in progress",
                  "recovery-required": "content ai turn requires recovery",
                  conflict: "stream id already used for a different request",
                  "not-owned": "content ai session not found",
              } as const
              if (claim.outcome !== "acquired") {
                  this.emitChunk({
                      client,
                      data: {
                          streamId,
                          delta: "",
                          done: true,
                          error: claimErrors[claim.outcome],
                      },
                  })
                  return
              }
              durableTurnAcquired = true
              groundingCourseId = courseId ?? claim.courseId
          }

          // register only an acquired request so a duplicate socket cannot
          // overwrite the original stream's abort controller
          controller = new AbortController()
          this.inFlight.set(key,
              controller)

          // ground the question by scope (lesson body + premium gate, or task /
          // foundation RAG) -- the service dispatches on which anchor id is present
          const { messages } = await this.contentAiService.prepareMessages({
              userId,
              contentId,
              taskId,
              challengeId,
              quizId,
              foundationId,
              courseId: groundingCourseId,
              question: groundedQuestion,
              history,
              locale: payload.locale,
          })

          // Hold the winning attempt at this business boundary too. AiInvoke
          // already prevents cross-provider partial concatenation; the gateway
          // additionally waits for the entitlement debit (and completed-turn
          // persistence) before exposing the answer, so a successful answer
          // can never escape without its one matching charge.
          const answerDeltas: Array<string> = []
          // ONE shared entry -- stream on the free floor, climbing to the tier
          // ceiling (local Qwen -> OpenRouter free -> economy+ only if all free fail)
          const {
              text: answer,
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
                  answerDeltas.push(delta)
              },
          })

          // Persist the provider result before crossing the entitlement seam.
          // If the process dies after this point, the durable charging state
          // prevents an automatic retry from issuing a second ambiguous debit.
          if (sessionId) {
              const charging = await this.contentAiService.markTurnCharging({
                  userId,
                  sessionId,
                  streamId,
                  requestHash,
                  answer,
              })
              if (!charging) {
                  const error = "content ai turn could not enter charging"
                  await this.contentAiService.markTurnTerminal({
                      userId,
                      sessionId,
                      streamId,
                      requestHash,
                      state: "failed",
                      errorCode: error,
                  })
                  this.emitChunk({
                      client,
                      data: {
                          streamId,
                          delta: "",
                          done: true,
                          error,
                      },
                  })
                  return
              }
          }

          // bill by the model that actually served -- free model = 0 (normal);
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

          // Complete the durable turn and visible transcript atomically before
          // any buffered model bytes cross the socket boundary.
          if (sessionId) {
              const completed = await this.contentAiService.completeTurn({
                  userId,
                  sessionId,
                  streamId,
                  requestHash,
                  contentId,
                  question,
                  answer,
              })
              if (!completed) {
                  this.emitChunk({
                      client,
                      data: {
                          streamId,
                          delta: "",
                          done: true,
                          error: "content ai turn could not complete",
                      },
                  })
                  return
              }
          }

          // Only a fully served, charged turn crosses the socket boundary.
          // Preserve the provider's successful chunk boundaries when flushing.
          for (const delta of answerDeltas) {
              this.emitChunk({
                  client,
                  data: {
                      streamId,
                      delta,
                      done: false,
                  },
              })
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
      // any failure (including abort) -> terminal chunk carrying the error
          const message = error instanceof Error ? error.message : String(error)
          if (sessionId && durableTurnAcquired) {
              try {
                  await this.contentAiService.markTurnTerminal({
                      userId,
                      sessionId,
                      streamId,
                      requestHash,
                      state: controller?.signal.aborted ? "cancelled" : "failed",
                      errorCode: message,
                  })
              } catch (terminalError) {
                  this.winstonService.log(WinstonLog.BestEffortOperationFailed,
                      {
                          op: "content-ai.mark-turn-terminal",
                          userId,
                          sessionId,
                          error:
              terminalError instanceof Error
                  ? terminalError.message
                  : String(terminalError),
                          meta: {
                              streamId,
                          },
                      })
              }
          }
          this.winstonService.log(WinstonLog.RealtimeStreamFailed,
              {
                  op: "content-ai.stream",
                  userId,
                  sessionId,
                  error: message,
                  meta: {
                      streamId,
                  },
              })
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
          if (controller) {
              this.inFlight.delete(key)
          }
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
  private streamKey(socketId: string, streamId: string): string {
      return `${socketId}:${streamId}`
  }

  /** Hash every request input that can affect the answer, excluding stream id. */
  private requestHash(payload: AskContentAiSocketIoPayload): string {
      const {
          sessionId,
          contentId,
          taskId,
          challengeId,
          quizId,
          foundationId,
          courseId,
          experience,
          operation,
          pageKind,
          selectedText,
          question,
          history,
          model,
          provider,
      } = payload.data
      return createHash("sha256")
          .update(
              JSON.stringify({
                  sessionId: sessionId ?? null,
                  contentId: contentId ?? null,
                  taskId: taskId ?? null,
                  challengeId: challengeId ?? null,
                  quizId: quizId ?? null,
                  foundationId: foundationId ?? null,
                  courseId: courseId ?? null,
                  experience: experience ?? null,
                  operation: operation ?? null,
                  pageKind: pageKind ?? null,
                  selectedText: selectedText?.trim() ?? null,
                  question,
                  history: (history ?? []).map((message) => [
                      message.role,
                      message.content,
                  ]),
                  model: model ?? null,
                  provider: provider ?? null,
                  locale: payload.locale,
              }),
          )
          .digest("hex")
  }

  /**
   * Emit one chunk message back to the requesting client.
   *
   * @param params - The target client and the chunk payload.
   */
  private emitChunk({ client, data }: EmitChunkParams): void {
      this.wsResponseService.success<ContentAiChunkSocketIoMessage>({
          message: "content ai chunk",
          data,
          client,
          eventName: SubscriptionEvent.ContentAiChunk,
      })
  }
}
