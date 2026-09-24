import {
    HumanMessage
} from "@langchain/core/messages"
import {
    ContentAiService
} from "@modules/bussiness/content-ai/content-ai.service"
import {
    ContentAiTurnEntity
} from "@modules/databases/postgresql/primary/entities/content-ai-turn.entity"
import {
    ModelProvider
} from "@modules/databases/postgresql/primary/enums/model-provider"
import {
    AddDurableContentAiTurns1787600000000
} from "@modules/databases/postgresql/primary/migrations/1787600000000-AddDurableContentAiTurns"
import {
    SubscriptionEvent
} from "../enums/subscription-event"
import {
    ContentAiGateway
} from "./content-ai.gateway"

const CLIENT = {
    id: "socket-1",
    data: {
        userId: "kc-user-1",
    },
}

const PAYLOAD = {
    locale: "en",
    data: {
        streamId: "stream-1",
        sessionId: "session-1",
        courseId: "course-1",
        question: "question",
    },
}

interface AiInvokeMockParams {
  onChunk?: (delta: string) => void;
  signal?: AbortSignal;
}

const createHarness = (courseAdvisorService?: Record<string, jest.Mock>) => {
    const contentAiService = {
        resolveUserIdByKeycloakId: jest.fn().mockResolvedValue("user-1"),
        acquireTurn: jest.fn().mockResolvedValue({
            outcome: "acquired",
            courseId: "course-1",
        }),
        prepareMessages: jest.fn().mockResolvedValue({
            messages: [new HumanMessage("question")],
        }),
        markTurnCharging: jest.fn().mockResolvedValue(true),
        completeTurn: jest.fn().mockResolvedValue(true),
        markTurnTerminal: jest.fn().mockResolvedValue(true),
    }
    const aiInvokeService = {
        run: jest.fn(async (params: AiInvokeMockParams) => {
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
    const aiEntitlementService = {
        consume: jest.fn().mockResolvedValue(undefined),
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
    courseAdvisorService as never,
    )
    return {
        gateway,
        contentAiService,
        aiInvokeService,
        aiEntitlementService,
        wsResponseService,
        courseAdvisorService,
    }
}

interface TransactionManagerMock {
  query: jest.Mock;
  insert: jest.Mock;
}

const createContentAiServiceHarness = (...queryResults: Array<unknown>) => {
    const manager: TransactionManagerMock = {
        query: jest.fn(),
        insert: jest.fn().mockResolvedValue(undefined),
    }
    for (const result of queryResults) {
        manager.query.mockResolvedValueOnce(result)
    }
    const entityManager = {
        query: manager.query,
        transaction: jest.fn(
            async (
                work: (transactionManager: TransactionManagerMock) => Promise<unknown>,
            ) => work(manager),
        ),
    }
    const service = new ContentAiService(
    entityManager as never,
    undefined as never,
    undefined as never,
    undefined as never,
    {
        hasCourseAccess: jest.fn().mockResolvedValue(true),
    } as never,
    undefined as never,
    )
    return {
        service,
        manager,
        entityManager,
    }
}

const TURN_PARAMS = {
    userId: "user-1",
    sessionId: "session-1",
    streamId: "stream-1",
    requestHash: "request-hash",
    courseId: "course-1",
}

describe("ContentAiGateway durable streaming policy",
    () => {
        it("persists the hidden advisor envelope but emits only validated fit metadata",
            async () => {
                const rawAnswer = "Helpful answer\n<!--starci-course-advisor:{}-->"
                const courseAdvisorService = {
                    prepareMessages: jest.fn().mockResolvedValue({
                        messages: [new HumanMessage("advisor question")],
                        candidateDisplayIds: ["fullstack-mastery"],
                    }),
                    parseResponse: jest.fn().mockReturnValue({
                        answer: "Helpful answer",
                        persistedAnswer: rawAnswer,
                        metadata: {
                            intent: "recommend",
                            recommendations: [
                                {
                                    courseDisplayId: "fullstack-mastery",
                                    reason: "Matches the goal",
                                    confidence: "high",
                                },
                            ],
                        },
                    }),
                }
                const harness = createHarness(courseAdvisorService)
                harness.aiInvokeService.run.mockResolvedValue({
                    text: rawAnswer,
                    model: "served-model",
                    provider: ModelProvider.Local,
                    cost: 1,
                    promptTokens: 10,
                    completionTokens: 2,
                    attempts: 1,
                })

                await harness.gateway.handleAskContentAi(CLIENT as never,
                    {
                        ...PAYLOAD,
                        data: {
                            ...PAYLOAD.data,
                            experience: "course_advisor",
                        },
                    } as never)

                expect(courseAdvisorService.prepareMessages).toHaveBeenCalledWith(
                    expect.objectContaining({
                        question: "question",
                        courseId: "course-1",
                    }),
                )
                expect(harness.contentAiService.completeTurn).toHaveBeenCalledWith(
                    expect.objectContaining({
                        answer: rawAnswer,
                    }),
                )
                expect(harness.wsResponseService.success).toHaveBeenNthCalledWith(1,
                    expect.objectContaining({
                        data: expect.objectContaining({
                            delta: "Helpful answer",
                            done: false,
                        }),
                    }),
                )
                expect(harness.wsResponseService.success).toHaveBeenNthCalledWith(2,
                    expect.objectContaining({
                        data: expect.objectContaining({
                            done: true,
                            courseAdvisor: expect.objectContaining({
                                intent: "recommend",
                            }),
                        }),
                    }),
                )
            })

        it("persists the charging barrier and completed transcript before exposing buffered deltas",
            async () => {
                const harness = createHarness()

                await harness.gateway.handleAskContentAi(CLIENT as never,
PAYLOAD as never)

                expect(harness.contentAiService.acquireTurn).toHaveBeenCalledWith(
                    expect.objectContaining({
                        userId: "user-1",
                        sessionId: "session-1",
                        streamId: "stream-1",
                        courseId: "course-1",
                        requestHash: expect.stringMatching(/^[0-9a-f]{64}$/),
                    }),
                )
                expect(harness.contentAiService.markTurnCharging).toHaveBeenCalledWith(
                    expect.objectContaining({
                        answer: "buffered answer",
                    }),
                )
                expect(harness.contentAiService.completeTurn).toHaveBeenCalledWith(
                    expect.objectContaining({
                        question: "question",
                        answer: "buffered answer",
                    }),
                )
                expect(
                    harness.contentAiService.completeTurn.mock.invocationCallOrder[0],
                ).toBeLessThan(
                    harness.wsResponseService.success.mock.invocationCallOrder[0],
                )
                expect(harness.wsResponseService.success).toHaveBeenNthCalledWith(1,
                    {
                        message: "content ai chunk",
                        eventName: SubscriptionEvent.ContentAiChunk,
                        client: CLIENT,
                        data: {
                            streamId: "stream-1",
                            delta: "buffered answer",
                            done: false,
                        },
                    })
            })

        it("replays a completed stream id without invoking, charging, or appending another transcript",
            async () => {
                const harness = createHarness()
                harness.contentAiService.acquireTurn.mockResolvedValue({
                    outcome: "replay",
                    answer: "stored answer",
                    courseId: "course-1",
                })

                await harness.gateway.handleAskContentAi(CLIENT as never,
PAYLOAD as never)

                expect(harness.aiInvokeService.run).not.toHaveBeenCalled()
                expect(harness.aiEntitlementService.consume).not.toHaveBeenCalled()
                expect(harness.contentAiService.completeTurn).not.toHaveBeenCalled()
                expect(harness.wsResponseService.success).toHaveBeenCalledTimes(2)
                expect(harness.wsResponseService.success).toHaveBeenNthCalledWith(
                    1,
                    expect.objectContaining({
                        data: {
                            streamId: "stream-1",
                            delta: "stored answer",
                            done: false,
                        },
                    }),
                )
            })

        it.each([
            ["in-progress",
                "content ai turn already in progress"],
            ["recovery-required",
                "content ai turn requires recovery"],
            ["conflict",
                "stream id already used for a different request"],
            ["not-owned",
                "content ai session not found"],
        ])(
            "returns one terminal error for a %s claim without invoking the model",
            async (outcome, error) => {
                const harness = createHarness()
                harness.contentAiService.acquireTurn.mockResolvedValue({
                    outcome,
                })

                await harness.gateway.handleAskContentAi(
        CLIENT as never,
        PAYLOAD as never,
                )

                expect(harness.aiInvokeService.run).not.toHaveBeenCalled()
                expect(harness.contentAiService.markTurnTerminal).not.toHaveBeenCalled()
                expect(harness.wsResponseService.success).toHaveBeenCalledWith(
                    expect.objectContaining({
                        data: {
                            streamId: "stream-1",
                            delta: "",
                            done: true,
                            error,
                        },
                    }),
                )
            },
        )

        it("does not expose or complete a provider answer when charging fails",
            async () => {
                const harness = createHarness()
                const chargeError = new Error("credit debit failed")
                harness.aiEntitlementService.consume.mockRejectedValue(chargeError)

                await harness.gateway.handleAskContentAi(CLIENT as never,
PAYLOAD as never)

                expect(harness.contentAiService.markTurnCharging).toHaveBeenCalledTimes(1)
                expect(harness.contentAiService.completeTurn).not.toHaveBeenCalled()
                expect(harness.contentAiService.markTurnTerminal).toHaveBeenCalledWith(
                    expect.objectContaining({
                        state: "failed",
                        errorCode: chargeError.message,
                    }),
                )
                expect(harness.wsResponseService.success).toHaveBeenCalledTimes(1)
                expect(harness.wsResponseService.success).toHaveBeenCalledWith(
                    expect.objectContaining({
                        data: {
                            streamId: "stream-1",
                            delta: "",
                            done: true,
                            error: chargeError.message,
                        },
                    }),
                )
            })

        it("persists cancellation when the learner aborts an acquired provider request",
            async () => {
                const harness = createHarness()
                let signalRunStarted: (() => void) | undefined
                const runStarted = new Promise<void>((resolve) => {
                    signalRunStarted = resolve
                })
                harness.aiInvokeService.run.mockImplementation(
                    async (params: AiInvokeMockParams) => {
                        signalRunStarted?.()
                        return new Promise<never>((_resolve, reject) => {
                            params.signal?.addEventListener(
                                "abort",
                                () => reject(new Error("aborted")),
                                {
                                    once: true,
                                },
                            )
                        })
                    },
                )

                const handling = harness.gateway.handleAskContentAi(
      CLIENT as never,
      PAYLOAD as never,
                )
                await runStarted
                harness.gateway.handleAbortContentAi(
      CLIENT as never,
      {
          data: {
              streamId: "stream-1",
          },
      } as never,
                )
                await handling

                expect(harness.contentAiService.markTurnTerminal).toHaveBeenCalledWith(
                    expect.objectContaining({
                        state: "cancelled",
                        errorCode: "aborted",
                    }),
                )
                expect(harness.aiEntitlementService.consume).not.toHaveBeenCalled()
                expect(harness.contentAiService.completeTurn).not.toHaveBeenCalled()
            })
    })

describe("ContentAiGateway durable branch policy",
    () => {
        it("attaches namespace authentication after initialization",
            () => {
                const harness = createHarness()
                const server = {
                    use: jest.fn(),
                }
                Object.defineProperty(harness.gateway,
                    "server",
                    {
                        value: server,
                    })

                harness.gateway.afterInit()

                expect(server.use).toHaveBeenCalledTimes(1)
            })

        it("rejects an unresolved socket identity before claiming a turn",
            async () => {
                const harness = createHarness()
                harness.contentAiService.resolveUserIdByKeycloakId.mockResolvedValue(null)

                await harness.gateway.handleAskContentAi(CLIENT as never,
PAYLOAD as never)

                expect(harness.contentAiService.acquireTurn).not.toHaveBeenCalled()
                expect(harness.wsResponseService.success).toHaveBeenCalledWith(
                    expect.objectContaining({
                        data: expect.objectContaining({
                            error: "not authenticated",
                        }),
                    }),
                )
            })

        it("emits only the terminal replay chunk when the stored answer is empty",
            async () => {
                const harness = createHarness()
                harness.contentAiService.acquireTurn.mockResolvedValue({
                    outcome: "replay",
                    answer: "",
                    courseId: "course-1",
                })

                await harness.gateway.handleAskContentAi(CLIENT as never,
PAYLOAD as never)

                expect(harness.wsResponseService.success).toHaveBeenCalledTimes(1)
                expect(harness.wsResponseService.success).toHaveBeenCalledWith(
                    expect.objectContaining({
                        data: {
                            streamId: "stream-1",
                            delta: "",
                            done: true,
                        },
                    }),
                )
            })

        it("stops before charging when the durable charging transition is rejected",
            async () => {
                const harness = createHarness()
                harness.contentAiService.markTurnCharging.mockResolvedValue(false)

                await harness.gateway.handleAskContentAi(CLIENT as never,
PAYLOAD as never)

                expect(harness.aiEntitlementService.consume).not.toHaveBeenCalled()
                expect(harness.contentAiService.completeTurn).not.toHaveBeenCalled()
                expect(harness.contentAiService.markTurnTerminal).toHaveBeenCalledWith(
                    expect.objectContaining({
                        state: "failed",
                    }),
                )
            })

        it("does not flush a charged answer when durable completion is rejected",
            async () => {
                const harness = createHarness()
                harness.contentAiService.completeTurn.mockResolvedValue(false)

                await harness.gateway.handleAskContentAi(CLIENT as never,
PAYLOAD as never)

                expect(harness.aiEntitlementService.consume).toHaveBeenCalledTimes(1)
                expect(harness.wsResponseService.success).toHaveBeenCalledTimes(1)
                expect(harness.wsResponseService.success).toHaveBeenCalledWith(
                    expect.objectContaining({
                        data: expect.objectContaining({
                            error: "content ai turn could not complete",
                        }),
                    }),
                )
            })

        it("keeps the legacy sessionless route free of durable turn writes",
            async () => {
                const harness = createHarness()
                const payload = {
                    locale: "en",
                    data: {
                        streamId: "stream-2",
                        contentId: "content-1",
                        question: "question",
                        history: [],
                        model: "model-1",
                        provider: ModelProvider.Local,
                    },
                }

                await harness.gateway.handleAskContentAi(CLIENT as never,
payload as never)

                expect(harness.contentAiService.acquireTurn).not.toHaveBeenCalled()
                expect(harness.contentAiService.markTurnCharging).not.toHaveBeenCalled()
                expect(harness.contentAiService.completeTurn).not.toHaveBeenCalled()
                expect(harness.aiEntitlementService.consume).toHaveBeenCalledTimes(1)
            })

        it("grounds a Learn selection while preserving the original transcript question",
            async () => {
                const harness = createHarness()
                const payload = {
                    locale: "vi",
                    data: {
                        ...PAYLOAD.data,
                        experience: "learn_companion",
                        operation: "translate",
                        pageKind: "lesson",
                        contentId: "content-1",
                        selectedText: "  lexical scope  ",
                        question: "Translate this passage",
                    },
                }

                await harness.gateway.handleAskContentAi(CLIENT as never,
payload as never)

                expect(harness.contentAiService.acquireTurn).toHaveBeenCalledWith(
                    expect.objectContaining({
                        courseId: "course-1",
                        contentId: "content-1",
                        experience: "learn_companion",
                    }),
                )
                expect(harness.contentAiService.prepareMessages).toHaveBeenCalledWith(
                    expect.objectContaining({
                        question:
          "Translate this passage\n\n=== SELECTED PASSAGE ===\nlexical scope",
                    }),
                )
                expect(harness.contentAiService.completeTurn).toHaveBeenCalledWith(
                    expect.objectContaining({
                        question: "Translate this passage",
                    }),
                )
            })

        it("rejects an oversized selection before claiming or invoking",
            async () => {
                const harness = createHarness()
                const payload = {
                    locale: "en",
                    data: {
                        ...PAYLOAD.data,
                        selectedText: "x".repeat(6_001),
                    },
                }

                await harness.gateway.handleAskContentAi(CLIENT as never,
payload as never)

                expect(harness.contentAiService.acquireTurn).not.toHaveBeenCalled()
                expect(harness.aiInvokeService.run).not.toHaveBeenCalled()
                expect(harness.wsResponseService.success).toHaveBeenCalledWith(
                    expect.objectContaining({
                        data: expect.objectContaining({
                            error: "selected text is too long",
                        }),
                    }),
                )
            })

        it("logs a secondary terminal-write failure without hiding the provider failure",
            async () => {
                const harness = createHarness()
                const log = jest.fn()
                Object.defineProperty(harness.gateway,
                    "winstonService",
                    {
                        value: {
                            log,
                        },
                    })
                harness.aiInvokeService.run.mockRejectedValue("provider unavailable")
                harness.contentAiService.markTurnTerminal.mockRejectedValue(
                    "journal unavailable",
                )

                await harness.gateway.handleAskContentAi(CLIENT as never,
PAYLOAD as never)

                expect(log).toHaveBeenCalledTimes(2)
                expect(harness.wsResponseService.success).toHaveBeenCalledWith(
                    expect.objectContaining({
                        data: expect.objectContaining({
                            error: "provider unavailable",
                        }),
                    }),
                )
            })

        it("ignores an abort for a stream that is not in flight",
            () => {
                const harness = createHarness()

                expect(() =>
                    harness.gateway.handleAbortContentAi(
        CLIENT as never,
        {
            data: {
                streamId: "missing-stream",
            },
        } as never,
                    ),
                ).not.toThrow()
            })

        it("rejects a missing socket identity before claiming a durable turn",
            async () => {
                const harness = createHarness()
                const client = {
                    id: "socket-2",
                    data: {
                    },
                }

                await harness.gateway.handleAskContentAi(
                    client as never,
                    PAYLOAD as never,
                )

                expect(harness.contentAiService.acquireTurn).not.toHaveBeenCalled()
                expect(harness.wsResponseService.success).toHaveBeenCalledWith(
                    expect.objectContaining({
                        data: expect.objectContaining({
                            error: expect.any(String),
                        }),
                    }),
                )
            })

        it("passes a complete pinned model selection through to the invoke boundary",
            async () => {
                const harness = createHarness()
                const payload = {
                    locale: "en",
                    data: {
                        ...PAYLOAD.data,
                        model: "gpt-pinned",
                        provider: ModelProvider.Local,
                    },
                }

                await harness.gateway.handleAskContentAi(CLIENT as never,
                    payload as never)

                expect(harness.aiInvokeService.run).toHaveBeenCalledWith(
                    expect.objectContaining({
                        selection: {
                            model: "gpt-pinned",
                            provider: ModelProvider.Local,
                        },
                    }),
                )
            })

        it("reports a rejected durable acquisition without invoking the provider",
            async () => {
                const harness = createHarness()
                harness.contentAiService.acquireTurn.mockResolvedValueOnce({
                    outcome: "rejected",
                    reason: "already-processing",
                })

                await harness.gateway.handleAskContentAi(CLIENT as never,
                    PAYLOAD as never)

                expect(harness.aiInvokeService.run).not.toHaveBeenCalled()
                expect(harness.wsResponseService.success).toHaveBeenCalledWith(
                    expect.objectContaining({
                        data: expect.objectContaining({
                            streamId: "stream-1",
                        }),
                    }),
                )
            })
    })

describe("ContentAiService durable turn journal",
    () => {
        it.each([
            [[],
                [],
                "not-owned"],
            [
                [
                    {
                        id: "turn-1",
                    },
                ],
                [
                    {
                        id: "turn-1",
                        requestHash: "request-hash",
                        state: "processing",
                        response: null,
                        courseId: "course-1",
                    },
                ],
                "acquired",
            ],
            [
                [],
                [
                    {
                        id: "turn-1",
                        requestHash: "different-hash",
                        state: "processing",
                        response: null,
                        courseId: "course-1",
                    },
                ],
                "conflict",
            ],
            [
                [],
                [
                    {
                        id: "turn-1",
                        requestHash: "request-hash",
                        state: "completed",
                        response: null,
                        courseId: "course-1",
                    },
                ],
                "replay",
            ],
            [
                [],
                [
                    {
                        id: "turn-1",
                        requestHash: "request-hash",
                        state: "processing",
                        response: null,
                        courseId: "course-1",
                    },
                ],
                "in-progress",
            ],
            [
                [],
                [
                    {
                        id: "turn-1",
                        requestHash: "request-hash",
                        state: "charging",
                        response: "answer",
                        courseId: "course-1",
                    },
                ],
                "recovery-required",
            ],
        ])(
            "classifies a claimed journal row as %s",
            async (inserted, rows, expectedOutcome) => {
                const harness = createContentAiServiceHarness(inserted,
                    rows)

                const result = await harness.service.acquireTurn(TURN_PARAMS)

                expect(result.outcome).toBe(expectedOutcome)
            },
        )

        it("reacquires an exact failed turn and increments its attempt",
            async () => {
                const harness = createContentAiServiceHarness(
                    [],
                    [
                        {
                            id: "turn-1",
                            requestHash: "request-hash",
                            state: "failed",
                            response: null,
                            courseId: "course-1",
                        },
                    ],
                    [],
                )

                const result = await harness.service.acquireTurn(TURN_PARAMS)

                expect(result).toEqual({
                    outcome: "acquired",
                    courseId: "course-1",
                })
                expect(harness.manager.query).toHaveBeenCalledTimes(3)
            })

        it("requires a non-empty provider answer before entering charging",
            async () => {
                const emptyHarness = createContentAiServiceHarness()
                const persistedHarness = createContentAiServiceHarness([
                    {
                        id: "turn-1",
                    },
                ])

                await expect(
                    emptyHarness.service.markTurnCharging({
                        ...TURN_PARAMS,
                        answer: "   ",
                    }),
                ).resolves.toBe(false)
                await expect(
                    persistedHarness.service.markTurnCharging({
                        ...TURN_PARAMS,
                        answer: " answer ",
                    }),
                ).resolves.toBe(true)
            })

        it("rejects invalid or mismatched completion and commits a matching transcript",
            async () => {
                const invalidHarness = createContentAiServiceHarness()
                await expect(
                    invalidHarness.service.completeTurn({
                        ...TURN_PARAMS,
                        question: " ",
                        answer: "answer",
                    }),
                ).resolves.toBe(false)
                await expect(
                    invalidHarness.service.completeTurn({
                        ...TURN_PARAMS,
                        question: "question",
                        answer: " ",
                    }),
                ).resolves.toBe(false)

                const missingHarness = createContentAiServiceHarness([])
                await expect(
                    missingHarness.service.completeTurn({
                        ...TURN_PARAMS,
                        question: "question",
                        answer: "answer",
                    }),
                ).resolves.toBe(false)

                const mismatchHarness = createContentAiServiceHarness([
                    {
                        id: "turn-1",
                        enrollmentId: "enrollment-1",
                        userId: null,
                        response: "different answer",
                    },
                ])
                await expect(
                    mismatchHarness.service.completeTurn({
                        ...TURN_PARAMS,
                        question: "question",
                        answer: "answer",
                    }),
                ).resolves.toBe(false)

                const completedHarness = createContentAiServiceHarness(
                    [
                        {
                            id: "turn-1",
                            enrollmentId: "enrollment-1",
                            userId: null,
                            response: "answer",
                        },
                    ],
                    [],
                    [],
                )
                await expect(
                    completedHarness.service.completeTurn({
                        ...TURN_PARAMS,
                        question: " question ",
                        answer: " answer ",
                    }),
                ).resolves.toBe(true)
                expect(completedHarness.manager.insert).toHaveBeenCalledTimes(1)
                expect(completedHarness.manager.query).toHaveBeenCalledTimes(3)
            })

        it("bounds terminal journal errors and reports whether a row changed",
            async () => {
                const updatedHarness = createContentAiServiceHarness([
                    {
                        id: "turn-1",
                    },
                ])
                const missingHarness = createContentAiServiceHarness([])

                await expect(
                    updatedHarness.service.markTurnTerminal({
                        ...TURN_PARAMS,
                        state: "cancelled",
                        errorCode: " ",
                    }),
                ).resolves.toBe(true)
                await expect(
                    missingHarness.service.markTurnTerminal({
                        ...TURN_PARAMS,
                        state: "failed",
                        errorCode: "provider-failure",
                    }),
                ).resolves.toBe(false)
            })
    })

describe("Durable content-AI persistence metadata",
    () => {
        it("constructs the turn entity and runs reversible migration SQL",
            async () => {
                const entity = new ContentAiTurnEntity()
                const queryRunner = {
                    query: jest.fn().mockResolvedValue(undefined),
                }
                const migration = new AddDurableContentAiTurns1787600000000()

                entity.state = "processing"
                await migration.up(queryRunner as never)
                await migration.down(queryRunner as never)

                expect(entity.state).toBe("processing")
                expect(queryRunner.query).toHaveBeenCalledTimes(3)
                expect(queryRunner.query).toHaveBeenLastCalledWith(
                    "DROP TABLE IF EXISTS \"content_ai_turns\"",
                )
            })
    })
