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

                const client = {
                    id: "socket-1",
                    data: {
                        userId: "kc-user-1",
                    },
                }

                await gateway.handleAskMockInterviewTurn(
                    client as never,
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

                // exactly one socket message went out -- the buffered interviewer
                // turn the provider streamed is never flushed on a failed charge
                expect(wsResponseService.success).toHaveBeenCalledTimes(1)
                // read back the ACTUAL emitted socket message and assert its
                // full payload, not a partial `toHaveBeenCalledWith` match --
                // proves the charge failure surfaces as a terminal error chunk
                // to the right client, on the right event, rather than the
                // buffered interviewer turn
                const [[emitted]] = wsResponseService.success.mock.calls
                expect(emitted).toEqual({
                    message: "mock interview chunk",
                    eventName: SubscriptionEvent.MockInterviewChunk,
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
