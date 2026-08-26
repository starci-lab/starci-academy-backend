import {
    makeEntityManagerMock,
    EntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import {
    EnrollmentEntity,
} from "@modules/databases/postgresql/primary/entities/enrollment.entity"
import {
    MilestoneTaskEntity,
} from "@modules/databases/postgresql/primary/entities/milestone-task.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    DayjsService,
} from "@modules/lib/mixin/dayjs.service"
import {
    GitRepositoryAccessDeniedException,
} from "@modules/platform/exceptions/errors/submission-review/git-repository-access-denied"
import {
    GitRepositoryEmptyException,
} from "@modules/platform/exceptions/errors/submission-review/git-repository-empty"
import {
    GitRepositoryLoadFailedException,
} from "@modules/platform/exceptions/errors/submission-review/git-repository-load-failed"
import {
    GitRepositoryNotFoundException,
} from "@modules/platform/exceptions/errors/submission-review/git-repository-not-found"

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

/**
 * Spy on QdrantVectorStore to PROVE the unified path never touches it directly --
 * retrieval now goes through the shared GradingRetrievalService.
 */
const qdrantCtor = jest.fn()
jest.mock(
    "@langchain/qdrant",
    () => ({
        QdrantVectorStore: Object.assign(
            jest.fn().mockImplementation(() => qdrantCtor()),
            {
                fromExistingCollection: jest.fn(),
                fromDocuments: jest.fn(),
            },
        ),
    }),
    {
        virtual: true
    },
)

import {
    ReviewMilestoneTaskGradeStepService,
} from "./review-milestone-task-grade-step.service"

/** Build the SUT with every constructor dep mocked. Returns the service + handles. */
const makeService = (entityManager: EntityManagerMock) => {
    const gradingRetrievalService = {
        retrieveGradingExcerpt: jest.fn().mockResolvedValue({
            excerpt: "EXCERPT-SOURCE",
        }),
    }
    const aiInvokeService = {
        run: jest.fn().mockResolvedValue({
            text: "{\"score\":80}",
            model: "m",
            provider: "p",
            attempts: 1,
        }),
    }
    const projectEvaluationParseService = {
        parse: jest.fn().mockReturnValue({
            score: 80,
            shortFeedback: "ok",
            details: [],
        }),
    }
    const projectEvaluationPromptService = {
        build: jest.fn().mockImplementation((input: { sourceExcerpt: string }) => ({
            systemText: "SYSTEM-PROMPT",
            humanText: `HUMAN-PROMPT\n${input.sourceExcerpt}`,
        })),
    }
    const aiEntitlementService = {
        assertNotOverQuota: jest.fn().mockResolvedValue(undefined),
    }
    const mountStorageService = {
        githubAccessToken: "ORG-TOKEN",
        appConfig: {
            systemConfig: {
                task: {
                    passThreshold: 0.5,
                },
            },
        },
    }
    const encryptionService = {
        decrypt: jest.fn(),
    }
    const jobActionService = {
        increaseJob: jest.fn(),
        saveExecutionResult: jest.fn(),
        failJob: jest.fn(),
    }

    const service = new ReviewMilestoneTaskGradeStepService(
        entityManager as never,
        jobActionService as never,
        {
            log: jest.fn(),
        } as never,
        mountStorageService as never,
        gradingRetrievalService as never,
        aiInvokeService as never,
        aiEntitlementService as never,
        new DayjsService(),
        projectEvaluationPromptService as never,
        projectEvaluationParseService as never,
        encryptionService as never,
    )

    return {
        service,
        gradingRetrievalService,
        aiInvokeService,
        projectEvaluationPromptService,
        projectEvaluationParseService,
        jobActionService,
    }
}

/** Minimal job + payload context the grade step reads. */
const makeContext = (overrides: Record<string, unknown> = {
}) => ({
    job: {
        id: "job-1",
        fencingToken: 7,
    },
    queueName: "review-milestone-task",
    payload: {
        taskId: "task-1",
        enrollmentId: "enroll-1",
        githubUrl: "https://github.com/me/repo",
        branch: "main",
        locale: Locale.En,
        lang: "typescript",
        ai: {
        },
        ...overrides,
    },
}) as never

/** A loaded doc the GithubRepoLoader stub returns. */
const docFixture = {
    pageContent: "console.log('hi')",
    metadata: {
        source: "src/index.ts",
    },
    id: "src/index.ts",
}

describe("ReviewMilestoneTaskGradeStepService",
    () => {
        let entityManager: EntityManagerMock

        beforeEach(() => {
            jest.clearAllMocks()
            entityManager = makeEntityManagerMock()
            loaderLoadMock.mockResolvedValue([docFixture])
            // EnrollmentEntity lookups (token + quota) resolve a usable enrollment
            entityManager.findOne.mockResolvedValue(null)
            entityManager.findOneOrFail.mockResolvedValue({
                id: "enroll-1",
                userId: "user-1",
            })
        })

        /** Program findOneOrFail to return the milestone task for MilestoneTaskEntity. */
        const programTask = (task: Record<string, unknown>) => {
            entityManager.findOneOrFail.mockImplementation(
                (entity: unknown) => {
                    if (entity === MilestoneTaskEntity) {
                        return Promise.resolve(task)
                    }
                    if (entity === EnrollmentEntity) {
                        return Promise.resolve({
                            id: "enroll-1",
                            userId: "user-1",
                        })
                    }
                    return Promise.resolve(null)
                },
            )
        }

        it("V2 task: maps v2Criteria → [{ body }] and feeds the unified retrieval excerpt to the grade",
            async () => {
                // verified (non-null) -> V2 path; outcome/approach criteria with per-lang langs
                programTask({
                    id: "task-1",
                    title: "Build the API",
                    verified: "2026-01-01",
                    maxScore: 100,
                    criterias: [],
                    outcomeCriteria: [
                        {
                            orderIndex: 0,
                            score: 10,
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
                            score: 40,
                            critical: false,
                            langs: [
                                {
                                    lang: "typescript",
                                    body: "APPROACH-TS",
                                },
                            ],
                        },
                    ],
                })

                const { service, gradingRetrievalService, aiInvokeService, projectEvaluationPromptService } =
                    makeService(entityManager)

                await service.process(makeContext())

                // retrieval was called once with the V2-mapped criteria (body-only, from v2Criteria)
                expect(gradingRetrievalService.retrieveGradingExcerpt).toHaveBeenCalledTimes(1)
                const call = gradingRetrievalService.retrieveGradingExcerpt.mock.calls[0][0]
                expect(call.criteria).toEqual([
                    {
                        body: "OUTCOME-TS",
                    },
                    {
                        body: "APPROACH-TS",
                    },
                ])
                // run namespace carries the fencing token (anti-corruption fencing)
                expect(call.runKey).toContain("7")
                expect(call.runKey).toContain("enroll-1")
                expect(call.runKey).toContain("task-1")
                // the embedding descriptor + the raw mapped documents are passed through
                expect(call.embedding).toEqual(expect.objectContaining({
                    model: expect.any(String),
                    provider: expect.anything(),
                }))
                expect(Array.isArray(call.documents)).toBe(true)
                expect(call.documents.length).toBeGreaterThan(0)

                // the returned excerpt is fed into the grade prompt (HumanMessage content)
                const runArg = aiInvokeService.run.mock.calls[0][0]
                const humanMessage = runArg.messages[1]
                expect(String(humanMessage.content)).toContain("EXCERPT-SOURCE")
                expect(String(runArg.messages[0].content)).toBe("SYSTEM-PROMPT")
                expect(projectEvaluationPromptService.build).toHaveBeenCalledWith(expect.objectContaining({
                    kind: "v2",
                    taskTitle: "Build the API",
                    targetLanguage: "English",
                    sourceExcerpt: "EXCERPT-SOURCE",
                    gradeMaxScore: 50,
                }))
            })

        it("legacy task: maps criterias (sorted by orderIndex) → [{ body: `text\\npromptText` }]",
            async () => {
                // no `verified` -> legacy path; out-of-order criterias must be sorted
                programTask({
                    id: "task-1",
                    title: "Legacy task",
                    verified: null,
                    maxScore: 50,
                    outcomeCriteria: [],
                    approachCriteria: [],
                    criterias: [
                        {
                            id: "c-second",
                            orderIndex: 1,
                            score: 20,
                            text: "TEXT-B",
                            promptText: "PROMPT-B",
                        },
                        {
                            id: "c-first",
                            orderIndex: 0,
                            score: 30,
                            text: "TEXT-A",
                            promptText: "PROMPT-A",
                        },
                    ],
                })

                const { service, gradingRetrievalService, projectEvaluationPromptService } = makeService(entityManager)

                await service.process(makeContext({
                    lang: undefined,
                }))

                const call = gradingRetrievalService.retrieveGradingExcerpt.mock.calls[0][0]
                // sorted by orderIndex, each body = `${text}\n${promptText}`
                expect(call.criteria).toEqual([
                    {
                        body: "TEXT-A\nPROMPT-A",
                    },
                    {
                        body: "TEXT-B\nPROMPT-B",
                    },
                ])
                expect(projectEvaluationPromptService.build).toHaveBeenCalledWith(expect.objectContaining({
                    kind: "legacy",
                    taskTitle: "Legacy task",
                    targetLanguage: "English",
                    sourceExcerpt: "EXCERPT-SOURCE",
                }))
            })

        it("does NOT use QdrantVectorStore directly — retrieval is delegated to GradingRetrievalService",
            async () => {
                programTask({
                    id: "task-1",
                    title: "t",
                    verified: "2026-01-01",
                    maxScore: 100,
                    criterias: [],
                    outcomeCriteria: [
                        {
                            orderIndex: 0,
                            score: 100,
                            critical: false,
                            langs: [
                                {
                                    lang: "typescript",
                                    body: "ONLY",
                                },
                            ],
                        },
                    ],
                    approachCriteria: [],
                })

                const { service, gradingRetrievalService } = makeService(entityManager)

                await service.process(makeContext())

                expect(qdrantCtor).not.toHaveBeenCalled()
                expect(gradingRetrievalService.retrieveGradingExcerpt).toHaveBeenCalledTimes(1)
            })
        it.each([
            ["404",
                GitRepositoryNotFoundException],
            ["403",
                GitRepositoryAccessDeniedException],
            ["network timeout",
                GitRepositoryLoadFailedException],
        ])("maps Github loader failure `%s` and fails the job",
            async (message, exception) => {
                programTask({
                    id: "task-1",
                    title: "t",
                    verified: null,
                    maxScore: 10,
                    criterias: [],
                })
                loaderLoadMock.mockRejectedValueOnce(new Error(message))
                const { service, jobActionService } = makeService(entityManager)

                await expect(service.process(makeContext({
                    branch: undefined,
                }))).rejects.toBeInstanceOf(exception)
                expect(jobActionService.failJob).toHaveBeenCalledWith(expect.objectContaining({
                    emitChangeEvent: true,
                }))
            })
        it("rejects an empty repository as a domain error before retrieval",
            async () => {
                programTask({
                    id: "task-1",
                    title: "empty",
                    verified: null,
                    maxScore: 10,
                    criterias: [],
                })
                loaderLoadMock.mockResolvedValueOnce([])
                const { service, gradingRetrievalService } = makeService(entityManager)

                await expect(service.process(makeContext())).rejects.toBeInstanceOf(GitRepositoryEmptyException)
                expect(gradingRetrievalService.retrieveGradingExcerpt).not.toHaveBeenCalled()
            })
    })
