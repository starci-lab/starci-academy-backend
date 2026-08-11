import {
    HumanMessage,
} from "@langchain/core/messages"
import {
    ModelProvider,
} from "@modules/databases/postgresql/primary/enums/model-provider"
import {
    MockInterviewGateway,
} from "./mock-interview.gateway"

describe("MockInterviewGateway streaming policy",
    () => {
        it("does not expose a completed interviewer turn when its charge fails",
            async () => {
                const mockInterviewTurnService = {
                    prepareTurn: jest.fn().mockResolvedValue({
                        messages: [
                            new HumanMessage("candidate answer"),
                        ],
                    }),
                }
                const aiInvokeService = {
                    run: jest.fn(async (params: { onChunk?: (delta: string) => void }) => {
                        params.onChunk?.("buffered interviewer turn")
                        return {
                            text: "buffered interviewer turn",
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
                const wsResponseService = {
                    success: jest.fn(),
                }
                const gateway = new MockInterviewGateway(
                    mockInterviewTurnService as never,
                    {
                        getUserByKeycloakId: jest.fn().mockResolvedValue({
                            id: "user-1",
                        }),
                    } as never,
                    aiInvokeService as never,
                    {
                        consume: jest.fn().mockRejectedValue(chargeError),
                    } as never,
                    wsResponseService as never,
                    {
                        findOne: jest.fn().mockResolvedValue({
                            id: "session-1",
                            createdAt: new Date(),
                        }),
                    } as never,
                    {
                        log: jest.fn(),
                    } as never,
                )

                await gateway.handleAskMockInterviewTurn(
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
                            courseId: "course-1",
                            promptId: "prompt-1",
                            promptTitle: "Design a queue",
                            phase: "requirements",
                            latestAnswer: "",
                            history: [],
                            mode: "design",
                        },
                    } as never,
                )

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
