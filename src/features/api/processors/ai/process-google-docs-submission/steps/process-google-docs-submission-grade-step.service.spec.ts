import {
    makeEntityManagerMock,
    EntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    AiQuotaExhaustedException,
} from "@modules/platform/exceptions/errors/ai/ai-quota-exhausted"
import {
    ProcessGoogleDocsSubmissionGradeStepService,
} from "./process-google-docs-submission-grade-step.service"

/** The shape the parse service returns and the step persists. */
const parsedEvaluation = {
    score: 10,
    shortFeedback: "ok",
    details: [],
}

/** Minimal job + payload context the grade step reads. */
const makeContext = (overrides: Record<string, unknown> = {
}) => ({
    job: {
        id: "job-1",
        fencingToken: 3,
    },
    queueName: "process-google-docs-submission",
    payload: {
        userChallengeSubmissionId: "ucs-1",
        enrollmentId: "enroll-1",
        locale: Locale.En,
        lang: "typescript",
        ai: {
        },
        ...overrides,
    },
    extended: {
        challenge: {
            title: "Design a URL shortener",
        },
        // empty criteria -> maxScore 0; grading still runs (focused on flow, not scoring math)
        challengeSubmission: {
            outcomeCriteria: [],
            approachCriteria: [],
        },
        userChallengeSubmission: {
            submissionUrl: "https://docs.google.com/document/d/abc",
        },
    },
}) as never

describe("ProcessGoogleDocsSubmissionGradeStepService",
    () => {
        let entityManager: EntityManagerMock
        let jobActionService: {
            loadExecutionResult: jest.Mock
            increaseJob: jest.Mock
            saveExecutionResult: jest.Mock
            failJob: jest.Mock
        }
        let winstonService: { log: jest.Mock }
        let mountStorageService: { appConfig: unknown }
        let aiInvokeService: { run: jest.Mock }
        let aiEntitlementService: { consume: jest.Mock; resolve: jest.Mock; assertNotOverQuota: jest.Mock }
        let googleDriverApiService: { fetchGoogleDocsText: jest.Mock }
        let challengeEvaluationParseService: { parse: jest.Mock }
        let challengeEvaluationPromptService: { build: jest.Mock }
        let gradingRetrievalService: { retrieveGradingExcerpt: jest.Mock }
        let service: ProcessGoogleDocsSubmissionGradeStepService

        beforeEach(() => {
            entityManager = makeEntityManagerMock()
            // enrollment lookup resolves the submitter
            entityManager.findOneOrFail.mockResolvedValue({
                id: "enroll-1",
                userId: "user-1",
                courseId: "course-1",
            })
            // transaction runs the callback with the same manager
            entityManager.transaction.mockImplementation(
                async (cb: (em: unknown) => Promise<unknown>) => cb(entityManager),
            )

            jobActionService = {
                // "creditCharged" marker absent by default -> grading charges once
                loadExecutionResult: jest.fn().mockResolvedValue(undefined),
                increaseJob: jest.fn(),
                saveExecutionResult: jest.fn(),
                failJob: jest.fn(),
            }
            winstonService = {
                log: jest.fn()
            }
            mountStorageService = {
                appConfig: {
                    systemConfig: {
                        challenge: {
                            passThreshold: 0.6,
                        },
                    },
                },
            }
            aiInvokeService = {
                run: jest.fn().mockResolvedValue({
                    text: "{\"score\":10}",
                    model: "m",
                    provider: "p",
                    attempts: 1,
                    cost: 2,
                }),
            }
            aiEntitlementService = {
                consume: jest.fn(),
                resolve: jest.fn(),
                assertNotOverQuota: jest.fn().mockResolvedValue(undefined),
            }
            googleDriverApiService = {
                fetchGoogleDocsText: jest.fn().mockResolvedValue({
                    text: "the learner's submitted document content",
                }),
            }
            challengeEvaluationParseService = {
                parse: jest.fn().mockReturnValue(parsedEvaluation),
            }
            challengeEvaluationPromptService = {
                build: jest.fn().mockReturnValue({
                    messages: [
                        {
                            content: "SYSTEM",
                        },
                        {
                            content: "most relevant excerpt",
                        },
                    ],
                    maxScore: 0,
                }),
            }
            gradingRetrievalService = {
                retrieveGradingExcerpt: jest.fn().mockResolvedValue({
                    excerpt: "most relevant excerpt",
                }),
            }

            service = new ProcessGoogleDocsSubmissionGradeStepService(
                entityManager as never,
                jobActionService as never,
                winstonService as never,
                mountStorageService as never,
                aiInvokeService as never,
                aiEntitlementService as never,
                googleDriverApiService as never,
                challengeEvaluationParseService as never,
                challengeEvaluationPromptService as never,
                gradingRetrievalService as never,
            )
        })

        it("happy path: loads doc → retrieves excerpt → grades → parses → persists",
            async () => {
                await service.process(makeContext())

                // 1. fetched the Google Doc by its url
                expect(googleDriverApiService.fetchGoogleDocsText).toHaveBeenCalledWith(
                    expect.objectContaining({
                        urlOrId: "https://docs.google.com/document/d/abc",
                    }),
                )
                // 2. retrieved the most relevant excerpt via the shared RAG service,
                //    namespaced by submission + fencing token
                expect(gradingRetrievalService.retrieveGradingExcerpt).toHaveBeenCalledWith(
                    expect.objectContaining({
                        runKey: "ucs-1-3",
                        jobId: "job-1",
                        documents: expect.any(Array),
                        embedding: expect.objectContaining({
                            model: expect.any(String),
                            provider: expect.anything(),
                        }),
                    }),
                )
                // 3. invoked the grading LLM for the submitter
                expect(aiInvokeService.run).toHaveBeenCalledWith(
                    expect.objectContaining({
                        userId: "user-1",
                    }),
                )
                expect(challengeEvaluationPromptService.build).toHaveBeenCalledWith(
                    expect.objectContaining({
                        source: "document",
                        challengeTitle: "Design a URL shortener",
                        targetLanguage: "English",
                        sourceExcerpt: "most relevant excerpt",
                    }),
                )
                // 4. parsed the raw LLM output
                expect(challengeEvaluationParseService.parse).toHaveBeenCalledWith(
                    "{\"score\":10}",
                    expect.objectContaining({
                        source: "document",
                    }),
                )
                // 5. advanced the step + persisted the evaluation under the "grade" key
                expect(jobActionService.increaseJob).toHaveBeenCalled()
                expect(jobActionService.saveExecutionResult).toHaveBeenCalledWith(
                    expect.objectContaining({
                        key: "grade",
                        executionResult: expect.objectContaining({
                            evaluation: parsedEvaluation,
                        }),
                    }),
                )
            })

        it("charges the submitter's AI quota once when the creditCharged marker is absent",
            async () => {
                await service.process(makeContext())

                // charged by the served-model cost (debit + history row), marker saved
                expect(aiEntitlementService.consume).toHaveBeenCalledWith(
                    expect.objectContaining({
                        userId: "user-1",
                        cost: 2,
                    }),
                )
                expect(jobActionService.saveExecutionResult).toHaveBeenCalledWith(
                    expect.objectContaining({
                        key: "creditCharged",
                        executionResult: true,
                    }),
                )
            })

        it("does not double-charge when the creditCharged marker is already set (re-run)",
            async () => {
                jobActionService.loadExecutionResult.mockResolvedValue(true)

                await service.process(makeContext())

                // no second debit on a stalled re-run
                expect(aiEntitlementService.consume).not.toHaveBeenCalled()
                // grading + persistence still happen
                expect(jobActionService.saveExecutionResult).toHaveBeenCalledWith(
                    expect.objectContaining({
                        key: "grade",
                    }),
                )
            })

        it("blocks when the shared credit pool is over quota",
            async () => {
                aiEntitlementService.assertNotOverQuota.mockRejectedValueOnce(
                    new AiQuotaExhaustedException({
                        window: "5h",
                    }),
                )

                await expect(
                    service.process(makeContext({
                        ai: {
                        },
                    })),
                ).rejects.toBeInstanceOf(AiQuotaExhaustedException)

                // never reached the LLM, and the job was marked failed
                expect(aiInvokeService.run).not.toHaveBeenCalled()
                expect(jobActionService.failJob).toHaveBeenCalled()
            })

        it("retrieval-degraded: empty excerpt still grades + persists (no crash)",
            async () => {
                gradingRetrievalService.retrieveGradingExcerpt.mockResolvedValue({
                    excerpt: "",
                })

                await service.process(makeContext())

                // grading proceeds with the empty-content fallback prompt
                expect(aiInvokeService.run).toHaveBeenCalled()
                expect(jobActionService.saveExecutionResult).toHaveBeenCalledWith(
                    expect.objectContaining({
                        key: "grade",
                    }),
                )
            })

        it("passes the Vietnamese locale through to the grading prompt",
            async () => {
                await service.process(makeContext({
                    locale: Locale.Vi
                }))

                expect(challengeEvaluationPromptService.build).toHaveBeenCalledWith(
                    expect.objectContaining({
                        targetLanguage: expect.stringMatching(/^Vietnamese/u),
                    }),
                )
            })

        it("uses empty optional challenge and document fields without skipping grading",
            async () => {
                const baseContext = makeContext() as Record<string, unknown>
                await service.process({
                    ...baseContext,
                    extended: undefined,
                } as never)

                expect(googleDriverApiService.fetchGoogleDocsText).toHaveBeenCalledWith({
                    urlOrId: "",
                })
                expect(challengeEvaluationPromptService.build).toHaveBeenCalledWith(
                    expect.objectContaining({
                        challengeTitle: "",
                    }),
                )
                expect(aiInvokeService.run).toHaveBeenCalled()
            })

        it("surfaces document fetch failures before invoking the grader",
            async () => {
                const failure = new Error("document unavailable")
                googleDriverApiService.fetchGoogleDocsText.mockRejectedValueOnce(failure)

                await expect(service.process(makeContext())).rejects.toBe(failure)
                expect(aiInvokeService.run).not.toHaveBeenCalled()
                expect(jobActionService.failJob).toHaveBeenCalledTimes(1)
            })
    })
