import {
    makeEntityManagerMock,
    EntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import {
    AiCeilSurface,
} from "@modules/databases/postgresql/primary/enums/ai-ceil-surface"
import {
    AiModelTask,
} from "@modules/databases/postgresql/primary/enums/ai-model-task"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"

/**
 * Stub `GithubRepoLoader` so no real clone/network happens -- every instance's
 * `.load()` resolves the docs the test programs via `loaderLoadMock`.
 */
const loaderLoadMock = jest.fn()
jest.mock(
    "@langchain/community/document_loaders/web/github",
    () => ({
        GithubRepoLoader: jest.fn().mockImplementation(() => ({
            load: loaderLoadMock,
        })),
    }),
)

import {
    ProcessGitSubmissionGradeStepService,
} from "./process-git-submission-grade-step.service"

/** A loaded doc the GithubRepoLoader stub returns. */
const docFixture = {
    pageContent: "console.log('hi')",
    metadata: {
        source: "src/index.ts",
    },
    id: "src/index.ts",
}

/** Build the SUT with every constructor dep mocked. Returns the service + handles. */
const makeService = (entityManager: EntityManagerMock) => {
    const jobActionService = {
        increaseJob: jest.fn(),
        saveExecutionResult: jest.fn(),
        loadExecutionResult: jest.fn().mockResolvedValue(undefined),
        failJob: jest.fn(),
    }
    const mountStorageService = {
        githubAccessToken: "ORG-TOKEN",
        appConfig: {
            systemConfig: {
                challenge: {
                    passThreshold: 0.5,
                },
            },
        },
    }
    const aiInvokeService = {
        run: jest.fn().mockResolvedValue({
            text: "{\"score\":80}",
            model: "m",
            provider: "p",
            attempts: 1,
            cost: 2,
        }),
    }
    const aiEntitlementService = {
        resolve: jest.fn(),
        consume: jest.fn(),
        assertNotOverQuota: jest.fn().mockResolvedValue(undefined),
    }
    const challengeEvaluationParseService = {
        parse: jest.fn().mockReturnValue({
            score: 80,
            shortFeedback: "ok",
            details: [],
        }),
    }
    const challengeEvaluationPromptService = {
        build: jest.fn().mockReturnValue({
            messages: [
                {
                    content: "SYSTEM",
                },
                {
                    content: "EXCERPT-SOURCE",
                },
            ],
            maxScore: 100,
        }),
    }
    const gradingRetrievalService = {
        retrieveGradingExcerpt: jest.fn().mockResolvedValue({
            excerpt: "EXCERPT-SOURCE",
            degraded: false,
        }),
    }
    const encryptionService = {
        decrypt: jest.fn(),
    }

    const service = new ProcessGitSubmissionGradeStepService(
        entityManager as never,
        jobActionService as never,
        {
            log: jest.fn(),
        } as never,
        mountStorageService as never,
        aiInvokeService as never,
        aiEntitlementService as never,
        challengeEvaluationParseService as never,
        challengeEvaluationPromptService as never,
        gradingRetrievalService as never,
        encryptionService as never,
    )

    return {
        service,
        jobActionService,
        aiInvokeService,
        aiEntitlementService,
        challengeEvaluationParseService,
        challengeEvaluationPromptService,
        gradingRetrievalService,
    }
}

/** Minimal job + payload + extended context the grade step reads. */
const makeContext = (overrides: Record<string, unknown> = {
}) => ({
    job: {
        id: "job-1",
        fencingToken: 7,
    },
    queueName: "process-git-submission",
    payload: {
        userChallengeSubmissionId: "ucs-1",
        enrollmentId: "enroll-1",
        branch: "main",
        locale: Locale.En,
        lang: "typescript",
        ai: {
        },
        ...overrides,
    },
    extended: {
        challenge: {
            title: "Build the API",
        },
        challengeSubmission: {
            outcomeScore: 30,
            approachScore: 70,
            outcomeCriteria: [
                {
                    orderIndex: 0,
                    critical: true,
                    langs: [
                        {
                            lang: "typescript",
                            body: "OUTCOME-TS",
                        },
                    ],
                },
            ],
            approachCriteria: [
                {
                    orderIndex: 0,
                    critical: false,
                    langs: [
                        {
                            lang: "typescript",
                            body: "APPROACH-TS",
                        },
                    ],
                },
            ],
        },
        userChallengeSubmission: {
            submissionUrl: "https://github.com/me/repo",
        },
    },
}) as never

describe("ProcessGitSubmissionGradeStepService",
    () => {
        let entityManager: EntityManagerMock

        beforeEach(() => {
            jest.clearAllMocks()
            entityManager = makeEntityManagerMock()
            loaderLoadMock.mockResolvedValue([docFixture])
            // token-lookup findOne (EnrollmentEntity) -> no stored token -> org token path
            entityManager.findOne.mockResolvedValue(null)
            // quota-debit findOneOrFail (EnrollmentEntity) -> resolvable user
            entityManager.findOneOrFail.mockResolvedValue({
                id: "enroll-1",
                userId: "user-1",
            })
        })

        it("happy path: load → split → retrieve → grade → parse → persists result",
            async () => {
                const {
                    service,
                    gradingRetrievalService,
                    aiInvokeService,
                    challengeEvaluationParseService,
                    challengeEvaluationPromptService,
                    jobActionService,
                } = makeService(entityManager)

                await service.process(makeContext())

                // retrieval invoked once with the resolved per-language criteria
                expect(gradingRetrievalService.retrieveGradingExcerpt).toHaveBeenCalledTimes(1)
                const call = gradingRetrievalService.retrieveGradingExcerpt.mock.calls[0][0]
                expect(call.criteria).toEqual([
                    expect.objectContaining({
                        body: "OUTCOME-TS",
                        kind: "outcome",
                    }),
                    expect.objectContaining({
                        body: "APPROACH-TS",
                        kind: "approach",
                    }),
                ])
                // run namespace carries the fencing token + submission id (anti-corruption fencing)
                expect(call.runKey).toContain("7")
                expect(call.runKey).toContain("ucs-1")
                // the raw mapped repo documents + embedding descriptor are passed through
                expect(Array.isArray(call.documents)).toBe(true)
                expect(call.documents.length).toBeGreaterThan(0)
                expect(call.embedding).toEqual(
                    expect.objectContaining({
                        model: expect.anything(),
                        provider: expect.anything(),
                    }),
                )

                // grading lane invoked, retrieved excerpt fed into the human prompt
                expect(aiInvokeService.run).toHaveBeenCalledTimes(1)
                const runArg = aiInvokeService.run.mock.calls[0][0]
                expect(String(runArg.messages[1].content)).toContain("EXCERPT-SOURCE")
                expect(challengeEvaluationPromptService.build).toHaveBeenCalledWith(
                    expect.objectContaining({
                        source: "code",
                        challengeTitle: "Build the API",
                        targetLanguage: "English",
                        sourceExcerpt: "EXCERPT-SOURCE",
                    }),
                )

                // parse called on the raw model text
                expect(challengeEvaluationParseService.parse).toHaveBeenCalledWith("{\"score\":80}")

                // grade execution result persisted for the complete step (heavy persistence tail)
                expect(jobActionService.saveExecutionResult).toHaveBeenCalledWith(
                    expect.objectContaining({
                        key: "grade",
                        executionResult: expect.objectContaining({
                            passed: true,
                            evaluation: expect.objectContaining({
                                score: 80,
                            }),
                        }),
                    }),
                )
                // step advanced
                expect(jobActionService.increaseJob).toHaveBeenCalledTimes(1)
            })

        it("charges the AI usage once before parsing (debit + history row), then marks the job",
            async () => {
                const {
                    service,
                    aiEntitlementService,
                    jobActionService,
                } = makeService(entityManager)

                await service.process(makeContext())

                // consumed by the served cost (Auto lane), full attribution recorded, marker saved
                expect(aiEntitlementService.consume).toHaveBeenCalledWith(
                    expect.objectContaining({
                        userId: "user-1",
                        cost: 2,
                        surface: AiCeilSurface.Grading,
                        task: AiModelTask.ChallengeGrading,
                        model: "m",
                        provider: "p",
                    }),
                )
                expect(jobActionService.saveExecutionResult).toHaveBeenCalledWith(
                    expect.objectContaining({
                        key: "creditCharged",
                        executionResult: true,
                    }),
                )
            })

        it("retrieval DEGRADED (degraded:true) still proceeds to grade + persist",
            async () => {
                const ctx = makeService(entityManager)
                ctx.gradingRetrievalService.retrieveGradingExcerpt.mockResolvedValue({
                    excerpt: "PARTIAL-EXCERPT",
                    degraded: true,
                })

                await ctx.service.process(makeContext())

                // a degraded retrieval does NOT abort -- grading + persistence still happen
                expect(ctx.aiInvokeService.run).toHaveBeenCalledTimes(1)
                expect(ctx.jobActionService.saveExecutionResult).toHaveBeenCalledWith(
                    expect.objectContaining({
                        key: "grade",
                    }),
                )
            })

        it("an invoke failure surfaces (failJob called, error rethrown)",
            async () => {
                const ctx = makeService(entityManager)
                ctx.aiInvokeService.run.mockRejectedValue(new Error("LLM exploded"))

                await expect(ctx.service.process(makeContext())).rejects.toThrow("LLM exploded")

                // job marked failed; no grade result persisted, no credit consumed
                expect(ctx.jobActionService.failJob).toHaveBeenCalledTimes(1)
                expect(ctx.aiEntitlementService.consume).not.toHaveBeenCalled()
                expect(ctx.jobActionService.saveExecutionResult).not.toHaveBeenCalledWith(
                    expect.objectContaining({
                        key: "grade",
                    }),
                )
            })

        it("uses main and configured embedding defaults when optional payload fields are absent",
            async () => {
                const ctx = makeService(entityManager)

                await ctx.service.process(makeContext({
                    branch: undefined,
                    embeddingModel: undefined,
                    embeddingProvider: undefined,
                }))

                expect(ctx.gradingRetrievalService.retrieveGradingExcerpt).toHaveBeenCalledWith(
                    expect.objectContaining({
                        embedding: expect.objectContaining({
                            model: expect.any(String),
                            provider: expect.any(String),
                        }),
                    }),
                )
            })

        it.each([
            ["404 repository",
                "repository not found: 404"],
            ["403 repository",
                "repository access denied: 403"],
            ["unexpected loader failure",
                "connection reset"],
        ])("maps %s to a failed job",
            async (_label, message) => {
                const ctx = makeService(entityManager)
                loaderLoadMock.mockRejectedValueOnce(new Error(message))

                await expect(ctx.service.process(makeContext())).rejects.toThrow(message)
                expect(ctx.jobActionService.failJob).toHaveBeenCalledWith(
                    expect.objectContaining({
                        error: expect.stringContaining(message),
                    }),
                )
                expect(ctx.gradingRetrievalService.retrieveGradingExcerpt).not.toHaveBeenCalled()
            })

        it("passes an empty repository through the retrieval boundary",
            async () => {
                const ctx = makeService(entityManager)
                loaderLoadMock.mockResolvedValueOnce([])

                await expect(ctx.service.process(makeContext())).resolves.toBeUndefined()
                expect(ctx.gradingRetrievalService.retrieveGradingExcerpt).toHaveBeenCalledWith(
                    expect.objectContaining({
                        documents: [],
                    }),
                )
                expect(ctx.aiInvokeService.run).toHaveBeenCalled()
            })

        it("uses empty optional challenge fields without changing the grading flow",
            async () => {
                const ctx = makeService(entityManager)
                const baseContext = makeContext() as Record<string, unknown>
                const context = {
                    ...baseContext,
                    extended: undefined,
                }

                await ctx.service.process(context as never)

                expect(ctx.challengeEvaluationPromptService.build).toHaveBeenCalledWith(
                    expect.objectContaining({
                        challengeTitle: "",
                    }),
                )
                expect(ctx.aiInvokeService.run).toHaveBeenCalled()
            })
    })
