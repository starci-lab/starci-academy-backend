import {
    HumanMessage,
} from "@langchain/core/messages"
import {
    ModelProvider,
} from "@modules/databases/postgresql/primary/enums/model-provider"
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

                await gateway.handleAskContentAi(
                    {
                        id: "socket-1",
                        data: {
                            userId: "kc-user-1",
                        },
                    } as never,
                    {
                        locale: "en",
                        data: {
                            streamId: "stream-1",
                            sessionId: "session-1",
                            question: "question",
                        },
                    } as never,
                )

                expect(contentAiService.saveTurn).not.toHaveBeenCalled()
                expect(wsResponseService.success).toHaveBeenCalledTimes(1)
                expect(wsResponseService.success).toHaveBeenCalledWith(
                    expect.objectContaining({
                        data: expect.objectContaining({
                            delta: "",
                            done: true,
                            error: chargeError.message,
                        }),
                    }),
                )
            })
    })
