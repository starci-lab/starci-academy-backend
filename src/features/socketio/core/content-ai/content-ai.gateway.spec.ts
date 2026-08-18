import {
    HumanMessage,
} from "@langchain/core/messages"
import {
    ModelProvider,
} from "@modules/databases/postgresql/primary/enums/model-provider"
import {
    SubscriptionEvent,
} from "../enums/subscription-event"
import {
    ContentAiGateway,
} from "./content-ai.gateway"

describe("ContentAiGateway streaming policy",
    () => {
        it("does not expose or persist a completed model answer when its charge fails",
            async () => {
                const contentAiService = {
                    resolveUserIdByKeycloakId: jest.fn().mockResolvedValue("user-1"),
                    prepareMessages: jest.fn().mockResolvedValue({
                        messages: [
                            new HumanMessage("question"),
                        ],
                    }),
                    saveTurn: jest.fn(),
                }
                const aiInvokeService = {
                    run: jest.fn(async (params: { onChunk?: (delta: string) => void }) => {
                        params.onChunk?.("buffered answer")
                        return {
                            text: "buffered answer",
                            model: "served-model",
                            provider: ModelProvider.Local,
                            cost: 1,
                            promptTokens: 10,
                            completionTokens: 2,
                            attempts: 1,
                        }
                    }),
                }
                const chargeError = new Error("credit debit failed")
                const aiEntitlementService = {
                    consume: jest.fn().mockRejectedValue(chargeError),
                }
                const wsResponseService = {
                    success: jest.fn(),
                }
                const gateway = new ContentAiGateway(
                    contentAiService as never,
                    aiInvokeService as never,
                    aiEntitlementService as never,
                    wsResponseService as never,
                    {
                        log: jest.fn(),
                    } as never,
                )
                const client = {
                    id: "socket-1",
                    data: {
                        userId: "kc-user-1",
                    },
                }

                await gateway.handleAskContentAi(
                    client as never,
                    {
                        locale: "en",
                        data: {
                            streamId: "stream-1",
                            sessionId: "session-1",
                            question: "question",
                        },
                    } as never,
                )

                // the turn must never be persisted once the charge fails
                expect(contentAiService.saveTurn).not.toHaveBeenCalled()
                // exactly one socket message went out -- the buffered answer
                // delta the provider streamed is never flushed on a failed charge
                expect(wsResponseService.success).toHaveBeenCalledTimes(1)
                // read back the ACTUAL emitted socket message (not a partial
                // `toHaveBeenCalledWith` match) and assert its full payload --
                // the client that receives it, the event name, and the chunk
                // content, proving the charge failure surfaces as a terminal
                // error chunk rather than the buffered answer
                const [[emitted]] = wsResponseService.success.mock.calls
                expect(emitted).toEqual({
                    message: "content ai chunk",
                    eventName: SubscriptionEvent.ContentAiChunk,
                    client,
                    data: {
                        streamId: "stream-1",
                        delta: "",
                        done: true,
                        error: chargeError.message,
                    },
                })
            })
    })
