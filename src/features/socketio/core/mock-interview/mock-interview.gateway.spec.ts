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

        it("returns a terminal authentication error when the socket user cannot be resolved",
            async () => {
                const wsResponseService = {
                    success: jest.fn(),
                }
                const gateway = new MockInterviewGateway(
                    {
                        prepareTurn: jest.fn(),
                    } as never,
                    {
                        getUserByKeycloakId: jest.fn().mockRejectedValue(new Error("unknown subject")),
                    } as never,
                    {
                        run: jest.fn(),
                    } as never,
                    {
                        consume: jest.fn(),
                    } as never,
                    wsResponseService as never,
                    {
                        findOne: jest.fn(),
                    } as never,
                    {
                        log: jest.fn(),
                    } as never,
                )
                const client = {
                    id: "socket-auth",
                    data: {
                        userId: "missing-subject",
                    },
                }

                await gateway.handleAskMockInterviewTurn(client as never,
                    {
                        data: {
                            streamId: "stream-auth",
                        },
                    } as never)

                expect(wsResponseService.success).toHaveBeenCalledWith(expect.objectContaining({
                    client,
                    data: {
                        streamId: "stream-auth",
                        delta: "",
                        done: true,
                        error: "not authenticated",
                    },
                }))
            })

        it("treats a resolved Keycloak subject without a local id as unauthenticated",
            async () => {
                const success = jest.fn()
                const gateway = new MockInterviewGateway(
                    {
                        prepareTurn: jest.fn(),
                    } as never,
                    {
                        getUserByKeycloakId: jest.fn().mockResolvedValue(undefined),
                    } as never,
                    {
                        run: jest.fn(),
                    } as never,
                    {
                        consume: jest.fn(),
                    } as never,
                    {
                        success,
                    } as never,
                    {
                        findOne: jest.fn(),
                    } as never,
                    {
                        log: jest.fn(),
                    } as never,
                )
                const client = {
                    id: "socket-empty-user",
                    data: {
                        userId: "subject-without-row",
                    },
                }

                await gateway.handleAskMockInterviewTurn(client as never,
                    {
                        data: {
                            streamId: "stream-empty-user",
                        },
                    } as never)

                expect(success).toHaveBeenCalledWith(expect.objectContaining({
                    data: expect.objectContaining({
                        error: "not authenticated",
                    }),
                }))
            })

        it("rejects an unresolved or expired session before preparing a prompt",
            async () => {
                const prepareTurn = jest.fn()
                const run = jest.fn()
                const success = jest.fn()
                const findOne = jest.fn().mockResolvedValueOnce(null)
                const gateway = new MockInterviewGateway(
                    {
                        prepareTurn,
                    } as never,
                    {
                        getUserByKeycloakId: jest.fn().mockResolvedValue({
                            id: "user-1",
                        }),
                    } as never,
                    {
                        run,
                    } as never,
                    {
                        consume: jest.fn(),
                    } as never,
                    {
                        success,
                    } as never,
                    {
                        findOne,
                    } as never,
                    {
                        log: jest.fn(),
                    } as never,
                )
                const client = {
                    id: "socket-session",
                    data: {
                        userId: "kc-user-1",
                    },
                }
                const payload = {
                    data: {
                        streamId: "stream-session",
                        sessionId: "missing-session",
                    },
                }

                await gateway.handleAskMockInterviewTurn(
                    client as never,
                    payload as never,
                )

                expect(prepareTurn).not.toHaveBeenCalled()
                expect(run).not.toHaveBeenCalled()
                expect(success).toHaveBeenCalledWith(expect.objectContaining({
                    data: expect.objectContaining({
                        error: "session not found",
                    }),
                }))

                findOne.mockResolvedValueOnce({
                    id: "expired-session",
                    createdAt: new Date(Date.now() - 3_600_001),
                })
                await gateway.handleAskMockInterviewTurn(client as never,
                    {
                        data: {
                            ...payload.data,
                            streamId: "stream-expired",
                            sessionId: "expired-session",
                        },
                    } as never)

                expect(prepareTurn).not.toHaveBeenCalled()
                expect(success).toHaveBeenLastCalledWith(expect.objectContaining({
                    data: expect.objectContaining({
                        streamId: "stream-expired",
                        error: "SESSION_EXPIRED",
                    }),
                }))
            })

        it("installs the auth middleware on initialization",
            () => {
                const use = jest.fn()
                const gateway = new MockInterviewGateway(
                    {
                    } as never,
                    {
                    } as never,
                    {
                    } as never,
                    {
                    } as never,
                    {
                    } as never,
                    {
                    } as never,
                    {
                    } as never,
                )
                Object.defineProperty(
                    gateway,
                    "server",
                    {
                        value: {
                            use,
                        },
                        configurable: true,
                    },
                )

                gateway.afterInit()

                expect(use).toHaveBeenCalledTimes(1)
                expect(use.mock.calls[0][0]).toEqual(expect.any(Function))
            })

        it("normalizes transcript roles and flushes buffered chunks after charging",
            async () => {
                const prepareTurn = jest.fn().mockResolvedValue({
                    messages: [new HumanMessage("prepared")],
                })
                const success = jest.fn()
                const gateway = new MockInterviewGateway(
                    {
                        prepareTurn,
                    } as never,
                    {
                        getUserByKeycloakId: jest.fn().mockResolvedValue({
                            id: "user-1",
                        }),
                    } as never,
                    {
                        run: jest.fn(async (params: { onChunk?: (delta: string) => void }) => {
                            params.onChunk?.("first")
                            params.onChunk?.("second")
                            return {
                                model: "model-1",
                                provider: ModelProvider.Local,
                                cost: 2,
                                promptTokens: 4,
                                completionTokens: 3,
                                attempts: 1,
                            }
                        }),
                    } as never,
                    {
                        consume: jest.fn().mockResolvedValue(undefined),
                    } as never,
                    {
                        success,
                    } as never,
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
                    id: "socket-success",
                    data: {
                        userId: "kc-user-1",
                    },
                }

                await gateway.handleAskMockInterviewTurn(client as never,
                    {
                        locale: "en",
                        data: {
                            streamId: "stream-success",
                            sessionId: "session-1",
                            courseId: "course-1",
                            promptTitle: "Design a queue",
                            phase: "requirements",
                            history: [
                                {
                                    role: "interviewer",
                                    content: "question",
                                },
                                {
                                    role: "unexpected",
                                    content: "answer",
                                },
                            ],
                            latestAnswer: "answer",
                            mode: "design",
                        },
                    } as never)

                expect(prepareTurn).toHaveBeenCalledWith(expect.objectContaining({
                    history: [
                        {
                            role: "interviewer",
                            content: "question",
                        },
                        {
                            role: "candidate",
                            content: "answer",
                        },
                    ],
                }))
                expect(success).toHaveBeenCalledTimes(3)
                expect(success.mock.calls.map((call) => call[0].data)).toEqual([
                    {
                        streamId: "stream-success",
                        delta: "first",
                        done: false,
                    },
                    {
                        streamId: "stream-success",
                        delta: "second",
                        done: false,
                    },
                    {
                        streamId: "stream-success",
                        delta: "",
                        done: true,
                    },
                ])
            })

        it("treats an abort for an unknown stream as a harmless no-op",
            () => {
                const gateway = new MockInterviewGateway(
                    {
                    } as never,
                    {
                    } as never,
                    {
                    } as never,
                    {
                    } as never,
                    {
                    } as never,
                    {
                    } as never,
                    {
                    } as never,
                )

                expect(() => gateway.handleAbortMockInterviewTurn(
                    {
                        id: "socket-id",
                    } as never,
                    {
                        data: {
                            streamId: "not-running",
                        },
                    } as never,
                )).not.toThrow()
            })

        it("surfaces non-Error preparation failures as terminal text",
            async () => {
                const success = jest.fn()
                const gateway = new MockInterviewGateway(
                    {
                        prepareTurn: jest.fn().mockRejectedValue("prompt unavailable"),
                    } as never,
                    {
                        getUserByKeycloakId: jest.fn().mockResolvedValue({
                            id: "user-1",
                        }),
                    } as never,
                    {
                        run: jest.fn(),
                    } as never,
                    {
                        consume: jest.fn(),
                    } as never,
                    {
                        success,
                    } as never,
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

                await gateway.handleAskMockInterviewTurn({
                    id: "socket-1",
                    data: {
                        userId: "kc-user-1",
                    },
                } as never,
                {
                    data: {
                        streamId: "stream-error",
                        sessionId: "session-1",
                    },
                } as never)

                expect(success).toHaveBeenCalledWith(expect.objectContaining({
                    data: expect.objectContaining({
                        streamId: "stream-error",
                        error: "prompt unavailable",
                    }),
                }))
            })

        it("does not invoke a provider when the session is already completed",
            async () => {
                const run = jest.fn()
                const success = jest.fn()
                const gateway = new MockInterviewGateway({
                    prepareTurn: jest.fn(),
                } as never,
{
    getUserByKeycloakId: jest.fn().mockResolvedValue({
        id: "user-1"
    }),
} as never,
{
    run
} as never,
{
    consume: jest.fn()
} as never,
                {
                    success
                } as never,
{
    findOne: jest.fn().mockResolvedValue({
        id: "session-1",
        status: "completed",
        createdAt: new Date(),
    }),
} as never,
{
    log: jest.fn()
} as never)

                await gateway.handleAskMockInterviewTurn({
                    id: "socket-1",
                    data: {
                        userId: "kc-1"
                    },
                } as never,
{
    data: {
        streamId: "stream-1",
        sessionId: "session-1",
    },
} as never)

                expect(run).not.toHaveBeenCalled()
                expect(success).toHaveBeenCalled()
            })

        it("passes a pinned model selection through to the provider",
            async () => {
                const run = jest.fn().mockResolvedValue({
                    model: "gpt-pinned",
                    provider: ModelProvider.OpenAI,
                    cost: 1,
                    promptTokens: 1,
                    completionTokens: 1,
                    attempts: 1,
                })
                const consume = jest.fn().mockResolvedValue(undefined)
                const success = jest.fn()
                const gateway = new MockInterviewGateway(
                    {
                        prepareTurn: jest.fn().mockResolvedValue({
                            messages: [new HumanMessage("prepared")],
                        }),
                    } as never,
                    {
                        getUserByKeycloakId: jest.fn().mockResolvedValue({
                            id: "user-pinned",
                        }),
                    } as never,
                    {
                        run,
                    } as never,
                    {
                        consume,
                    } as never,
                    {
                        success,
                    } as never,
                    {
                        findOne: jest.fn().mockResolvedValue({
                            id: "session-pinned",
                            createdAt: new Date(),
                        }),
                    } as never,
                    {
                        log: jest.fn(),
                    } as never,
                )

                await gateway.handleAskMockInterviewTurn({
                    id: "socket-pinned",
                    data: {
                        userId: "subject-pinned",
                    },
                } as never,
{
    locale: "en",
    data: {
        streamId: "stream-pinned",
        sessionId: "session-pinned",
        courseId: "course-1",
        promptTitle: "Question",
        phase: "requirements",
        latestAnswer: "answer",
        history: [],
        mode: "design",
        model: "gpt-pinned",
        provider: ModelProvider.OpenAI,
    },
} as never)

                expect(run).toHaveBeenCalledWith(expect.objectContaining({
                    selection: {
                        model: "gpt-pinned",
                        provider: ModelProvider.OpenAI,
                    },
                }))
                expect(consume).toHaveBeenCalled()
                expect(success).toHaveBeenCalled()
            })
    })
