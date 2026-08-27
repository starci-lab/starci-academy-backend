import {
    FindOperator,
} from "typeorm"
import {
    FlashcardCardEntity,
} from "@modules/databases/postgresql/primary/entities/flashcard-card.entity"
import {
    MockInterviewAttemptEntity,
} from "@modules/databases/postgresql/primary/entities/mock-interview-attempt.entity"
import {
    MockInterviewSessionEntity,
} from "@modules/databases/postgresql/primary/entities/mock-interview-session.entity"
import {
    MockInterviewEntity,
} from "@modules/databases/postgresql/primary/entities/mock-interview.entity"
import {
    AiCeilSurface,
} from "@modules/databases/postgresql/primary/enums/ai-ceil-surface"
import {
    AiModelTask,
} from "@modules/databases/postgresql/primary/enums/ai-model-task"
import {
    MockInterviewMode,
} from "@modules/databases/postgresql/primary/enums/mock-interview-mode"
import {
    ModelProvider,
} from "@modules/databases/postgresql/primary/enums/model-provider"
import {
    WinstonLog,
} from "@modules/platform/winston/enums/winston-log"
import {
    ParsingCriteriaResultsFromModelTextException,
} from "@modules/platform/exceptions/errors/ai/parsing-criteria-results-from-model-text"
import {
    MockInterviewGradingService,
} from "./grade-mock-interview-session-grading.service"
import {
    GradeMockInterviewSessionParseService,
} from "./grade-mock-interview-session-parse.service"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    MockInterviewPhase,
} from "@modules/databases/postgresql/primary/enums/mock-interview-phase"
import {
    MockInterviewSessionTooShortException,
} from "@modules/platform/exceptions/errors/ai/mock-interview-session-too-short"
import type {
    GradeMockInterviewSessionParams,
    MockInterviewPhaseScore,
    MockInterviewQuestionReview,
    MockInterviewSeedGrounding,
    MockInterviewTurnRecord,
} from "./types/mock-interview-grade"

/**
 * Guards how a question's score is derived from the checkpoints the grader reported as
 * covered, rather than taken as a number the model picked.
 *
 * Two properties matter. The score is the SUM of the covered bands, so the same answer
 * always earns the same score and the total is explainable per checkpoint. And missing a
 * checkpoint marked `critical` caps the result -- a candidate who skipped the point the
 * question exists to test has not passed it, however much peripheral credit they piled up.
 */
describe("MockInterviewGradingService — scoring from covered checkpoints",
    () => {
        const service = new MockInterviewGradingService(
        undefined as never,
        undefined as never,
        undefined as never,
        undefined as never,
        undefined as never,
        undefined as never,
        undefined as never,
        undefined as never,
        undefined as never,
        )

        const score = (
            checkpoints: Array<{ critical: boolean, scoreBand: number }>,
            covered: Array<number>,
        ) => (service as unknown as {
        scoreFromCheckpoints: (
            points: Array<{ text: string, dimension: string | null, critical: boolean, scoreBand: number }>,
            covered: Array<number>,
        ) => number
    }).scoreFromCheckpoints(
            checkpoints.map((c, i) => ({
                text: `checkpoint ${i}`,
                dimension: "technical",
                critical: c.critical,
                scoreBand: c.scoreBand,
            })),
            covered,
        )

        /** Three non-critical points worth 40/30/30. */
        const plain = [
            {
                critical: false, scoreBand: 40,
            },
            {
                critical: false, scoreBand: 30,
            },
            {
                critical: false, scoreBand: 30,
            },
        ]

        /**
     * First point is must-hit. The other two sum to 80, deliberately ABOVE the cap -- an
     * uncapped implementation would return 80 here, so the cap test actually discriminates
     * instead of landing on a number both behaviours produce.
     */
        const withCritical = [
            {
                critical: true, scoreBand: 20,
            },
            {
                critical: false, scoreBand: 40,
            },
            {
                critical: false, scoreBand: 40,
            },
        ]

        it("sums the bands of the covered checkpoints",
            () => {
                expect(score(plain,
                    [0])).toBe(40)
                expect(score(plain,
                    [1,
                        2])).toBe(60)
            })

        it("gives 100 when every checkpoint is covered",
            () => {
                expect(score(plain,
                    [0,
                        1,
                        2])).toBe(100)
                expect(score(withCritical,
                    [0,
                        1,
                        2])).toBe(100)
            })

        it("gives 0 when nothing is covered",
            () => {
                expect(score(plain,
                    [])).toBe(0)
            })

        it("caps the score when a critical checkpoint was missed",
            () => {
                // covered both non-critical points -- 80 raw -- but skipped the must-hit one
                expect(score(withCritical,
                    [1,
                        2])).toBe(60)
            })

        it("caps even an otherwise-high score when the critical point is missed",
            () => {
                const heavy = [
                    {
                        critical: true, scoreBand: 10,
                    },
                    {
                        critical: false, scoreBand: 90,
                    },
                ]
                // 90 points of peripheral credit, but the must-hit point is absent
                expect(score(heavy,
                    [1])).toBe(60)
            })

        it("ignores duplicate and out-of-range checkpoint numbers from the model",
            () => {
                // a repeated index must not be counted twice, and 7 does not exist
                expect(score(plain,
                    [0,
                        0,
                        7,
                        -1])).toBe(40)
            })
    })

describe("MockInterviewGradingService — substantive-answer guard",
    () => {
        const entityManager = {
            findOne: jest.fn().mockResolvedValue(null),
        }
        const aiInvokeService = {
            run: jest.fn(),
        }
        const aiEntitlementService = {
            assertNotOverQuota: jest.fn(),
            consume: jest.fn(),
        }
        const gradingLaneValidationService = {
            validate: jest.fn(),
        }
        const contentRagRetrievalService = {
            retrieveCourseExcerpt: jest.fn(),
        }
        const userService = {
            resolveOrCreateTrialEnrollment: jest.fn().mockResolvedValue({
                id: "enrollment-1",
            }),
        }
        const winstonService = {
            log: jest.fn(),
        }
        const service = new MockInterviewGradingService(
            entityManager as never,
            undefined as never,
            undefined as never,
            aiInvokeService as never,
            gradingLaneValidationService as never,
            aiEntitlementService as never,
            contentRagRetrievalService as never,
            userService as never,
            winstonService as never,
        )

        it("rejects a too-short transcript before quota, model invocation, charge, or RAG",
            async () => {
                const params: GradeMockInterviewSessionParams = {
                    userId: "user-1",
                    courseId: "course-1",
                    promptId: "prompt-1",
                    promptTitle: "Design a queue",
                    level: "middle",
                    sessionId: "session-1",
                    locale: Locale.En,
                    turns: [
                        {
                            role: "interviewer",
                            phase: MockInterviewPhase.Requirements,
                            content: "What would you clarify?",
                        },
                        {
                            role: "candidate",
                            phase: MockInterviewPhase.Requirements,
                            content: "Not sure.",
                        },
                    ],
                }

                await expect((service as unknown as {
                    gradeOnce: (input: GradeMockInterviewSessionParams) => Promise<unknown>
                }).gradeOnce(params)).rejects.toThrow(MockInterviewSessionTooShortException)

                expect(aiEntitlementService.assertNotOverQuota).not.toHaveBeenCalled()
                expect(gradingLaneValidationService.validate).not.toHaveBeenCalled()
                expect(contentRagRetrievalService.retrieveCourseExcerpt).not.toHaveBeenCalled()
                expect(aiInvokeService.run).not.toHaveBeenCalled()
                expect(aiEntitlementService.consume).not.toHaveBeenCalled()
            })
    })

/** A candidate answer comfortably above the substantive-transcript floor. */
const LONG_ANSWER = "We would put a durable message queue between the ingest API and the workers, "
    + "so a traffic burst never blocks the request path and retries stay idempotent."

/** The trial enrollment every grade resolves to. */
const GRADE_ENROLLMENT = {
    id: "enrollment-1",
}

/** One authored per-language body of a bank question, as the grounding resolver reads it. */
interface GroundingBodyRow {
    /** Track language of the body. */
    lang: string
    /** Authored order among the question's bodies. */
    sortIndex: number
    /** Per-language prompt, or null to fall back to the parent's. */
    prompt: string | null
    /** Per-language ideal answer, or null to fall back to the parent's. */
    idealAnswer: string | null
    /** Per-language given code. */
    givenCode: string
}

/** One authored coverage checkpoint of a bank question. */
interface GroundingChecklistRow {
    /** The checkpoint statement. */
    text: string
    /** Grading dimension, or null when unlabelled. */
    dimension: string | null
    /** Whether missing this checkpoint should sink the answer. */
    critical: boolean
    /** Points the checkpoint is worth. */
    scoreBand: number
    /** Authored order. */
    sortIndex: number
}

/** One `mock_interviews` row as the grounding resolver reads it. */
interface GroundingBankRow {
    /** Row id, matched against the seed's cardId. */
    id: string
    /** Parent (agnostic) prompt. */
    prompt: string
    /** Parent ideal answer, or null. */
    idealAnswer: string | null
    /** Legacy flat rubric, or null. */
    rubric: Array<string> | null
    /** Coverage keywords, or null. */
    keywords: Array<string> | null
    /** Behavioral ownership note appended to the rubric, or null. */
    ownershipSignal: string | null
    /** Parent given code, or null. */
    givenCode: string | null
    /** Language of the parent given code, or null. */
    givenLang: string | null
    /** Per-language bodies; omitted for a root-authored question. */
    langs?: Array<GroundingBodyRow>
    /** Authored checkpoints; omitted for a question still on the flat rubric. */
    checklists?: Array<GroundingChecklistRow>
}

/** What course RAG retrieval reports for a design-mode grade. */
interface GradeFixtureRagExcerpt {
    excerpt: string
    retrievedChunks: number
    matchedContentIds: Array<string>
}

/** Everything the grading service's collaborators resolve to for one test. */
interface GradeFixture {
    /** The already-persisted attempt replayed by a repeat request, or null. */
    attempt: Record<string, unknown> | null
    /** The server-drawn session row, or null to force the client-identity fallback. */
    session: Record<string, unknown> | null
    /** `mock_interviews` rows the seed grounding resolves against. */
    bankRows: Array<GroundingBankRow>
    /** `flashcard_cards` rows the legacy seed grounding resolves against. */
    flashcardCards: Array<{ id: string, question: string, answer: string | null }>
    /** Raw model output the AI lane returns. */
    modelText: string
    /** What course RAG retrieval reports for a design-mode grade. */
    excerpt: GradeFixtureRagExcerpt
}

/** The default provider scorecard: one scored question, one attribute, one feedback line. */
const MODEL_SCORECARD = {
    overallScore: 70,
    verdict: "borderline",
    phaseScores: [{
        phase: "requirements",
        score: 70,
        max: 100,
    }],
    attributeScores: [{
        key: "communication",
        score: 65,
    }],
    strengths: ["named the bottleneck"],
    gaps: ["no capacity estimate"],
    followUpQuestion: "How would you shard it?",
    questionFeedback: [{
        index: 0,
        feedback: "missed the index",
    }],
    coveredCheckpoints: [],
}

/** Builds a grading service whose every collaborator is programmed from one fixture. */
const makeGradingHarness = (
    fixture: Partial<GradeFixture> = {
    },
) => {
    const queryRunner = {
        connect: jest.fn(async () => undefined),
        query: jest.fn(async () => []),
        release: jest.fn(async () => undefined),
    }
    const transactionManager = {
        findOne: jest.fn(async (entity: unknown) => entity === MockInterviewSessionEntity
            ? fixture.session ?? null
            : null),
        findOneBy: jest.fn(async () => null),
        create: jest.fn((_entity: unknown, data: Record<string, unknown>) => data),
        save: jest.fn(async (
            _entity: unknown,
            data: Record<string, unknown>,
        ) => data),
        update: jest.fn(async () => ({
            affected: 1,
        })),
    }
    const entityManager = {
        connection: {
            createQueryRunner: jest.fn(() => queryRunner),
        },
        findOne: jest.fn(async (entity: unknown) => {
            if (entity === MockInterviewAttemptEntity) {
                return fixture.attempt ?? null
            }
            if (entity === MockInterviewSessionEntity) {
                return fixture.session ?? null
            }
            return null
        }),
        find: jest.fn(async (
            entity: unknown,
            options: { where: { id: FindOperator<string> } },
        ): Promise<Array<unknown>> => {
            const ids = options.where.id.value
            if (entity === MockInterviewEntity) {
                return (fixture.bankRows ?? []).filter((row) => ids.includes(row.id))
            }
            if (entity === FlashcardCardEntity) {
                return (fixture.flashcardCards ?? []).filter((card) => ids.includes(card.id))
            }
            return []
        }),
        update: jest.fn(async () => ({
            affected: 1
        })),
        transaction: jest.fn(async (
            callback: (manager: unknown) => Promise<unknown>,
        ) => callback(transactionManager)),
    }
    const mockInterviewGradePromptService = {
        build: jest.fn(() => ({
            messages: [],
        })),
    }
    // the parser is a pure normalizer with its own suite -- run the real one so these
    // tests assert the scorecard a real provider response actually produces
    const gradeMockInterviewSessionParseService = new GradeMockInterviewSessionParseService()
    const aiInvokeService = {
        run: jest.fn(async () => ({
            text: fixture.modelText ?? JSON.stringify(MODEL_SCORECARD),
            model: "gpt-test",
            provider: ModelProvider.OpenAI,
            cost: 7,
            promptTokens: 1200,
            completionTokens: 340,
            attempts: 2,
        })),
    }
    const gradingLaneValidationService = {
        validate: jest.fn(async () => ({
            gradingModel: "gpt-test",
            gradingProvider: ModelProvider.OpenAI,
        })),
    }
    const aiEntitlementService = {
        assertNotOverQuota: jest.fn(async () => undefined),
        consume: jest.fn(async () => undefined),
    }
    const contentRagRetrievalService = {
        retrieveCourseExcerpt: jest.fn(async () => fixture.excerpt ?? {
            excerpt: "An index speeds up lookups.",
            retrievedChunks: 3,
            matchedContentIds: ["content-1",
                "content-2"],
        }),
    }
    const userService = {
        resolveOrCreateTrialEnrollment: jest.fn(async () => GRADE_ENROLLMENT),
    }
    const winstonService = {
        log: jest.fn(),
    }
    const service = new MockInterviewGradingService(
        entityManager as never,
        mockInterviewGradePromptService as never,
        gradeMockInterviewSessionParseService,
        aiInvokeService as never,
        gradingLaneValidationService as never,
        aiEntitlementService as never,
        contentRagRetrievalService as never,
        userService as never,
        winstonService as never,
    )
    return {
        service,
        entityManager,
        transactionManager,
        queryRunner,
        mockInterviewGradePromptService,
        aiInvokeService,
        gradingLaneValidationService,
        aiEntitlementService,
        contentRagRetrievalService,
        userService,
        winstonService,
    }
}

/** Builds grade params, defaulting to a substantive single-question design transcript. */
const gradeParams = (
    overrides: Partial<GradeMockInterviewSessionParams> = {
    },
): GradeMockInterviewSessionParams => ({
    userId: "user-1",
    courseId: "course-1",
    promptId: "client-prompt",
    promptTitle: "Client title",
    level: "junior",
    sessionId: "session-1",
    locale: Locale.En,
    turns: [
        {
            role: "interviewer",
            phase: MockInterviewPhase.Requirements,
            content: "How would you absorb the burst?",
            questionIndex: 0,
        },
        {
            role: "candidate",
            phase: MockInterviewPhase.Requirements,
            content: LONG_ANSWER,
            questionIndex: 0,
        },
    ],
    ...overrides,
})

/** Builds a persisted session row, defaulting to a qna draw with one seed. */
const sessionRow = (
    overrides: Record<string, unknown> = {
    },
) => ({
    id: "session-1",
    promptId: "server-prompt",
    promptTitle: "Server title",
    level: "senior",
    lang: null,
    mode: MockInterviewMode.Qna,
    seedQuestions: [{
        cardId: "card-1",
        kind: "theory",
        title: "What is an index?",
        givenCodes: [],
    }],
    countsToReadiness: false,
    name: "Friday practice",
    ...overrides,
})

/** Builds a bank row, defaulting to a root-authored question with no bodies. */
const groundingBankRow = (
    overrides: Partial<GroundingBankRow> & { id: string },
): GroundingBankRow => ({
    prompt: "parent prompt",
    idealAnswer: "parent answer",
    rubric: null,
    keywords: null,
    ownershipSignal: null,
    givenCode: null,
    givenLang: null,
    ...overrides,
})

/** Reads back the seed groundings the prompt service was built with. */
const builtGroundings = (
    harness: ReturnType<typeof makeGradingHarness>,
): Array<MockInterviewSeedGrounding> => {
    const calls = harness.mockInterviewGradePromptService.build.mock.calls as unknown as Array<[
        { seedGroundings: Array<MockInterviewSeedGrounding> },
    ]>
    return calls[0][0].seedGroundings
}

/**
 * Grading is charged, model-backed work, so a repeat request for the same session must
 * replay the durable attempt instead of paying for it twice. The advisory lock is what
 * makes that check safe across replicas, and it has to be released whichever way the
 * grade ends.
 */
describe("MockInterviewGradingService — replay under the session lock",
    () => {
        /** A persisted attempt whose stored review row is fully populated. */
        const attemptRow = {
            overallScore: 82,
            verdict: "pass",
            phaseScores: [{
                phase: "requirements",
                score: 82,
                max: 100,
            }],
            attributeScores: [{
                key: "communication",
                score: 80,
            }],
            strengths: ["clear tradeoffs"],
            gaps: ["thin on failure modes"],
            followUpQuestion: "What breaks first under load?",
            matchedContentIds: ["content-7"],
            questionReviews: [{
                questionIndex: 0,
                kind: "theory",
                question: "What is an index?",
                candidateAnswer: "A lookup structure.",
                modelAnswer: "A B-tree over a column.",
                feedback: "Name the structure.",
                score: 82,
                max: 100,
                matchedContentId: "content-7",
            }],
        }

        it("returns the persisted attempt without invoking or charging the model again",
            async () => {
                const harness = makeGradingHarness({
                    attempt: attemptRow,
                })

                const result = await harness.service.grade(gradeParams())

                expect(result).toEqual({
                    overallScore: 82,
                    verdict: "pass",
                    phaseScores: [{
                        phase: "requirements",
                        score: 82,
                        max: 100,
                    }],
                    attributeScores: [{
                        key: "communication",
                        score: 80,
                    }],
                    strengths: ["clear tradeoffs"],
                    gaps: ["thin on failure modes"],
                    followUpQuestion: "What breaks first under load?",
                    matchedContentIds: ["content-7"],
                    questionReviews: [{
                        questionIndex: 0,
                        kind: "theory",
                        question: "What is an index?",
                        candidateAnswer: "A lookup structure.",
                        modelAnswer: "A B-tree over a column.",
                        feedback: "Name the structure.",
                        score: 82,
                        max: 100,
                        matchedContentId: "content-7",
                    }],
                })
                expect(harness.aiInvokeService.run).not.toHaveBeenCalled()
                expect(harness.aiEntitlementService.consume).not.toHaveBeenCalled()
                expect(harness.entityManager.transaction).toHaveBeenCalledTimes(1)
            })

        it("takes and releases the session advisory lock around the replay check",
            async () => {
                const harness = makeGradingHarness({
                    attempt: attemptRow,
                })

                await harness.service.grade(gradeParams({
                    sessionId: "session-77",
                }))

                expect(harness.queryRunner.query).toHaveBeenNthCalledWith(
                    1,
                    "SELECT pg_advisory_lock(hashtextextended($1, 0))",
                    ["mock-interview-grade:session-77"],
                )
                expect(harness.queryRunner.query).toHaveBeenNthCalledWith(
                    2,
                    "SELECT pg_advisory_unlock(hashtextextended($1, 0))",
                    ["mock-interview-grade:session-77"],
                )
                expect(harness.queryRunner.release).toHaveBeenCalledTimes(1)
            })

        it("releases the lock and propagates the error when grading rejects",
            async () => {
                const harness = makeGradingHarness()

                await expect(harness.service.grade(gradeParams({
                    turns: [{
                        role: "candidate",
                        phase: MockInterviewPhase.Requirements,
                        content: "no",
                    }],
                }))).rejects.toThrow(MockInterviewSessionTooShortException)

                expect(harness.queryRunner.release).toHaveBeenCalledTimes(1)
            })

        it("normalizes a persisted attempt whose stored review row lost its typed fields",
            async () => {
                const harness = makeGradingHarness({
                    attempt: {
                        ...attemptRow,
                        verdict: "not-a-verdict",
                        overallScore: 40,
                        strengths: null,
                        gaps: [
                            "  keep  ",
                            7,
                            "   ",
                        ],
                        matchedContentIds: null,
                        questionReviews: [{
                            questionIndex: "0",
                            score: "55",
                            max: "100",
                        }],
                    },
                })

                const result = await harness.service.grade(gradeParams())

                // the verdict is unreadable, so it is re-derived from the stored score
                expect(result.verdict).toBe("fail")
                expect(result.strengths).toEqual([])
                expect(result.gaps).toEqual(["keep"])
                expect(result.matchedContentIds).toEqual([])
                expect(result.questionReviews).toEqual([{
                    questionIndex: 0,
                    kind: "",
                    question: "",
                    candidateAnswer: "",
                    modelAnswer: null,
                    feedback: "",
                    score: 55,
                    max: 100,
                    matchedContentId: null,
                }])
            })

        it("grades for real when no attempt has been persisted for the session yet",
            async () => {
                const harness = makeGradingHarness({
                    session: sessionRow({
                        mode: MockInterviewMode.Design,
                        seedQuestions: null,
                    }),
                })

                const result = await harness.service.grade(gradeParams())

                expect(harness.aiInvokeService.run).toHaveBeenCalledTimes(1)
                expect(result.overallScore).toBe(70)
            })
    })

/**
 * The prompt, level and especially the MODE a session is graded against come from the
 * server's own draw row, never from the client -- otherwise a learner could claim a
 * harder prompt to inflate their readiness average, or claim "design" to dodge the Q&A
 * rubric. A session predating the draw row still grades, on the client's values plus a
 * warn.
 */
describe("MockInterviewGradingService — trusted prompt identity",
    () => {
        it("grades against the server's stored prompt, level, mode and readiness flag",
            async () => {
                const harness = makeGradingHarness({
                    session: sessionRow({
                        seedQuestions: [],
                    }),
                })

                await harness.service.grade(gradeParams())

                expect(harness.entityManager.findOne).toHaveBeenCalledWith(
                    MockInterviewSessionEntity,
                    expect.objectContaining({
                        where: {
                            id: "session-1",
                            enrollment: {
                                id: GRADE_ENROLLMENT.id,
                            },
                        },
                    }),
                )
                expect(harness.transactionManager.save).toHaveBeenCalledWith(
                    MockInterviewAttemptEntity,
                    expect.objectContaining({
                        promptId: "server-prompt",
                        promptTitle: "Server title",
                        level: "senior",
                        mode: MockInterviewMode.Qna,
                        countsToReadiness: false,
                        name: "Friday practice",
                    }),
                )
            })

        it("falls back to the client's identity as a design session, and records the miss",
            async () => {
                const harness = makeGradingHarness({
                    session: null,
                })

                await harness.service.grade(gradeParams())

                expect(harness.winstonService.log).toHaveBeenCalledWith(
                    WinstonLog.BestEffortOperationFailed,
                    expect.objectContaining({
                        op: "mock-interview.resolve-session",
                        userId: "user-1",
                        sessionId: "session-1",
                        meta: expect.objectContaining({
                            enrollmentId: GRADE_ENROLLMENT.id,
                            clientPromptId: "client-prompt",
                        }),
                    }),
                )
                expect(harness.transactionManager.save).toHaveBeenCalledWith(
                    MockInterviewAttemptEntity,
                    expect.objectContaining({
                        promptId: "client-prompt",
                        promptTitle: "Client title",
                        level: "junior",
                        mode: MockInterviewMode.Design,
                        countsToReadiness: true,
                        name: null,
                    }),
                )
            })

        it("treats a stored session with no seed questions as having none to ground",
            async () => {
                const harness = makeGradingHarness({
                    session: sessionRow({
                        seedQuestions: null,
                    }),
                })

                await harness.service.grade(gradeParams())

                expect(builtGroundings(harness)).toEqual([])
                expect(harness.entityManager.find).not.toHaveBeenCalled()
            })

        it("normalizes an unrecognized stored mode into the qna rubric",
            async () => {
                const harness = makeGradingHarness({
                    session: sessionRow({
                        mode: "whiteboard",
                        seedQuestions: [],
                    }),
                })

                await harness.service.grade(gradeParams())

                expect(harness.contentRagRetrievalService.retrieveCourseExcerpt).not.toHaveBeenCalled()
                expect(harness.transactionManager.save).toHaveBeenCalledWith(
                    MockInterviewAttemptEntity,
                    expect.objectContaining({
                        mode: MockInterviewMode.Qna,
                    }),
                )
            })
    })

/**
 * The ground truth a Q&A answer is scored against is fetched server-side from the
 * session's own persisted seeds -- never taken from the client, which would let a
 * learner forge or drop the reference answer used against them. Each seed resolves to
 * the exact language body the question was delivered in.
 */
describe("MockInterviewGradingService — seed grounding resolution",
    () => {
        /** A qna session whose seeds are the given ids, in ask order. */
        const qnaSession = (
            seeds: Array<Record<string, unknown>>,
        ) => sessionRow({
            seedQuestions: seeds,
        })

        it("grounds a bank question in its authored checkpoints and the ownership note",
            async () => {
                const harness = makeGradingHarness({
                    session: qnaSession([{
                        cardId: "bank-1",
                        kind: "SCENARIO",
                        title: "t",
                        givenCodes: [],
                    }]),
                    bankRows: [groundingBankRow({
                        id: "bank-1",
                        keywords: ["btree"],
                        ownershipSignal: "Says I, not we",
                        rubric: ["ignored once checkpoints exist"],
                        checklists: [
                            {
                                text: "Mentions caching",
                                dimension: null,
                                critical: false,
                                scoreBand: 0,
                                sortIndex: 1,
                            },
                            {
                                text: "Explains the index",
                                dimension: "technical",
                                critical: true,
                                scoreBand: 40,
                                sortIndex: 0,
                            },
                        ],
                    })],
                })

                await harness.service.grade(gradeParams())

                expect(builtGroundings(harness)).toEqual([{
                    cardId: "bank-1",
                    kind: "scenario",
                    question: "parent prompt",
                    answer: "parent answer",
                    keywords: ["btree"],
                    rubric: [
                        "[technical] Explains the index (MUST-HIT) (40 pts)",
                        "Mentions caching",
                        "[Ownership] Says I, not we",
                    ],
                    checkpoints: [
                        {
                            text: "Explains the index",
                            dimension: "technical",
                            critical: true,
                            scoreBand: 40,
                        },
                        {
                            text: "Mentions caching",
                            dimension: null,
                            critical: false,
                            scoreBand: 0,
                        },
                    ],
                    givenCode: null,
                    givenLang: null,
                }])
            })

        it("falls back to the flat rubric for a question with no checklist yet",
            async () => {
                const harness = makeGradingHarness({
                    session: qnaSession([{
                        cardId: "bank-1",
                        kind: "theory",
                        title: "t",
                        givenCodes: [],
                    }]),
                    bankRows: [groundingBankRow({
                        id: "bank-1",
                        rubric: ["Names the tradeoff"],
                    })],
                })

                await harness.service.grade(gradeParams())

                const [grounding] = builtGroundings(harness)
                expect(grounding.rubric).toEqual(["Names the tradeoff"])
                expect(grounding.checkpoints).toBeUndefined()
                expect(grounding.keywords).toEqual([])
            })

        it("carries no rubric at all when neither a checklist nor a flat rubric is authored",
            async () => {
                const harness = makeGradingHarness({
                    session: qnaSession([{
                        cardId: "bank-1",
                        kind: "theory",
                        title: "t",
                        givenCodes: [],
                    }]),
                    bankRows: [groundingBankRow({
                        id: "bank-1",
                    })],
                })

                await harness.service.grade(gradeParams())

                expect(builtGroundings(harness)[0].rubric).toBeUndefined()
            })

        it("grades a question against the language body it was actually drawn in",
            async () => {
                const harness = makeGradingHarness({
                    session: qnaSession([{
                        cardId: "bank-1",
                        kind: "debug",
                        title: "t",
                        givenCodes: [{
                            lang: "go",
                            code: "go code",
                        }],
                    }]),
                    bankRows: [groundingBankRow({
                        id: "bank-1",
                        langs: [
                            {
                                lang: "java",
                                sortIndex: 0,
                                prompt: "java prompt",
                                idealAnswer: "java answer",
                                givenCode: "java given",
                            },
                            {
                                lang: "go",
                                sortIndex: 1,
                                prompt: "go prompt",
                                idealAnswer: "go answer",
                                givenCode: "go given",
                            },
                        ],
                    })],
                })

                await harness.service.grade(gradeParams({
                    turns: [
                        {
                            role: "candidate",
                            phase: MockInterviewPhase.Requirements,
                            content: `[Code lang=java] ${LONG_ANSWER}`,
                            questionIndex: 0,
                        },
                    ],
                }))

                // java is both the session's first body AND the submitted language -- the
                // drawn language still wins
                expect(builtGroundings(harness)[0]).toMatchObject({
                    question: "go prompt",
                    answer: "go answer",
                    givenCode: "go given",
                    givenLang: "go",
                })
            })

        it("falls back to the language the candidate actually submitted code in",
            async () => {
                const harness = makeGradingHarness({
                    session: qnaSession([{
                        cardId: "bank-1",
                        kind: "debug",
                        title: "t",
                        givenCodes: [],
                    }]),
                    bankRows: [groundingBankRow({
                        id: "bank-1",
                        langs: [
                            {
                                lang: "typescript",
                                sortIndex: 0,
                                prompt: "ts prompt",
                                idealAnswer: "ts answer",
                                givenCode: "ts given",
                            },
                            {
                                lang: "java",
                                sortIndex: 1,
                                prompt: "java prompt",
                                idealAnswer: "java answer",
                                givenCode: "java given",
                            },
                        ],
                    })],
                })

                await harness.service.grade(gradeParams({
                    turns: [
                        {
                            role: "interviewer",
                            phase: MockInterviewPhase.Requirements,
                            content: "[Code lang=csharp] never read from an interviewer turn",
                            questionIndex: 0,
                        },
                        {
                            role: "candidate",
                            phase: MockInterviewPhase.Requirements,
                            content: "[Code lang=csharp] untagged turns are skipped",
                        },
                        {
                            role: "candidate",
                            phase: MockInterviewPhase.Requirements,
                            content: LONG_ANSWER,
                            questionIndex: 0,
                        },
                        {
                            role: "candidate",
                            phase: MockInterviewPhase.Requirements,
                            content: "[Code lang=java]\nfixed()",
                            questionIndex: 0,
                        },
                    ],
                }))

                expect(builtGroundings(harness)[0]).toMatchObject({
                    question: "java prompt",
                    givenLang: "java",
                })
            })

        it("falls back to the legacy session language when nothing else identifies the body",
            async () => {
                const harness = makeGradingHarness({
                    session: sessionRow({
                        lang: "go",
                        seedQuestions: [{
                            cardId: "bank-1",
                            kind: "theory",
                            title: "t",
                            givenCodes: [],
                        }],
                    }),
                    bankRows: [groundingBankRow({
                        id: "bank-1",
                        langs: [
                            {
                                lang: "typescript",
                                sortIndex: 0,
                                prompt: "ts prompt",
                                idealAnswer: null,
                                givenCode: "ts given",
                            },
                            {
                                lang: "go",
                                sortIndex: 1,
                                prompt: null,
                                idealAnswer: null,
                                givenCode: "go given",
                            },
                        ],
                    })],
                })

                await harness.service.grade(gradeParams())

                // the go body carries neither prompt nor answer -- the parent's are used
                expect(builtGroundings(harness)[0]).toMatchObject({
                    question: "parent prompt",
                    answer: "parent answer",
                    givenCode: "go given",
                    givenLang: "go",
                })
            })

        it("falls back to the first authored body when no language matches at all",
            async () => {
                const harness = makeGradingHarness({
                    session: qnaSession([{
                        cardId: "bank-1",
                        kind: "theory",
                        title: "t",
                        givenCodes: [],
                    }]),
                    bankRows: [groundingBankRow({
                        id: "bank-1",
                        langs: [
                            {
                                lang: "java",
                                sortIndex: 1,
                                prompt: "java prompt",
                                idealAnswer: "java answer",
                                givenCode: "java given",
                            },
                            {
                                lang: "csharp",
                                sortIndex: 0,
                                prompt: "csharp prompt",
                                idealAnswer: "csharp answer",
                                givenCode: "csharp given",
                            },
                        ],
                    })],
                })

                await harness.service.grade(gradeParams())

                expect(builtGroundings(harness)[0]).toMatchObject({
                    question: "csharp prompt",
                    answer: "csharp answer",
                    givenLang: "csharp",
                })
            })

        it("grounds a body-less question in the parent row's own given code",
            async () => {
                const harness = makeGradingHarness({
                    session: qnaSession([{
                        cardId: "bank-1",
                        kind: "debug",
                        title: "t",
                        givenCodes: [],
                    }]),
                    bankRows: [groundingBankRow({
                        id: "bank-1",
                        givenCode: "docker run",
                        givenLang: "dockerfile",
                    })],
                })

                await harness.service.grade(gradeParams())

                expect(builtGroundings(harness)[0]).toMatchObject({
                    question: "parent prompt",
                    givenCode: "docker run",
                    givenLang: "dockerfile",
                })
            })

        it("grounds a legacy flashcard seed in the card's answer and its chip keywords",
            async () => {
                const harness = makeGradingHarness({
                    session: qnaSession([{
                        cardId: "card-9",
                        kind: "reasoning",
                        title: "t",
                        givenCodes: [],
                    }]),
                    bankRows: [],
                    flashcardCards: [{
                        id: "card-9",
                        question: "What is an index?",
                        answer: "A B-tree.\n\n:::chip\nbtree\nlookup\n:::",
                    }],
                })

                await harness.service.grade(gradeParams())

                expect(builtGroundings(harness)).toEqual([{
                    cardId: "card-9",
                    kind: "reasoning",
                    question: "What is an index?",
                    answer: "A B-tree.\n\n:::chip\nbtree\nlookup\n:::",
                    keywords: ["btree",
                        "lookup"],
                }])
            })

        it("drops a seed whose card was deleted after the session started",
            async () => {
                const harness = makeGradingHarness({
                    session: qnaSession([
                        {
                            cardId: "gone",
                            kind: "theory",
                            title: "t",
                            givenCodes: [],
                        },
                        {
                            cardId: "bank-1",
                            kind: "theory",
                            title: "t",
                            givenCodes: [],
                        },
                    ]),
                    bankRows: [groundingBankRow({
                        id: "bank-1",
                    })],
                })

                await harness.service.grade(gradeParams())

                expect(builtGroundings(harness).map((grounding) => grounding.cardId))
                    .toEqual(["bank-1"])
            })

        it("restores the persisted ask order regardless of the row order the database returns",
            async () => {
                const harness = makeGradingHarness({
                    session: qnaSession([
                        {
                            cardId: "bank-b",
                            kind: "theory",
                            title: "t",
                            givenCodes: [],
                        },
                        {
                            cardId: "bank-a",
                            kind: "theory",
                            title: "t",
                            givenCodes: [],
                        },
                    ]),
                    bankRows: [
                        groundingBankRow({
                            id: "bank-a",
                        }),
                        groundingBankRow({
                            id: "bank-b",
                        }),
                    ],
                })

                await harness.service.grade(gradeParams())

                expect(builtGroundings(harness).map((grounding) => grounding.cardId)).toEqual([
                    "bank-b",
                    "bank-a",
                ])
            })
    })

/**
 * The two grading lanes ground differently. A design session has no per-question
 * reference, so it retrieves course material; a Q&A session's authored answer IS the
 * ground truth, so it skips retrieval entirely -- cheaper, and immune to a retrieval
 * miss scoring a correct answer down.
 */
describe("MockInterviewGradingService — grounding, quota and charge",
    () => {
        it("grounds a design grade in retrieved course material and reports the lessons",
            async () => {
                const harness = makeGradingHarness({
                    session: sessionRow({
                        mode: MockInterviewMode.Design,
                        seedQuestions: null,
                    }),
                })

                const result = await harness.service.grade(gradeParams())

                expect(harness.contentRagRetrievalService.retrieveCourseExcerpt).toHaveBeenCalledWith({
                    courseId: "course-1",
                    query: LONG_ANSWER,
                    topK: 10,
                })
                expect(result.matchedContentIds).toEqual([
                    "content-1",
                    "content-2",
                ])
                expect(result.questionReviews).toEqual([])
                expect(harness.mockInterviewGradePromptService.build).toHaveBeenCalledWith(
                    expect.objectContaining({
                        mode: MockInterviewMode.Design,
                        courseExcerpt: "An index speeds up lookups.",
                        promptTitle: "Server title",
                        level: "senior",
                        locale: Locale.En,
                    }),
                )
            })

        it("truncates a very long transcript before using it as the retrieval query",
            async () => {
                const harness = makeGradingHarness({
                    session: sessionRow({
                        mode: MockInterviewMode.Design,
                        seedQuestions: null,
                    }),
                })

                await harness.service.grade(gradeParams({
                    turns: [{
                        role: "candidate",
                        phase: MockInterviewPhase.Requirements,
                        content: "q".repeat(5000),
                    }],
                }))

                const calls = harness.contentRagRetrievalService.retrieveCourseExcerpt.mock.calls as unknown as Array<[
                    { query: string },
                ]>
                expect(calls[0][0].query).toHaveLength(2000)
            })

        it("skips content retrieval for a qna grade because the authored answer is the truth",
            async () => {
                const harness = makeGradingHarness({
                    session: sessionRow({
                        seedQuestions: [],
                    }),
                })

                const result = await harness.service.grade(gradeParams())

                expect(harness.contentRagRetrievalService.retrieveCourseExcerpt).not.toHaveBeenCalled()
                expect(harness.mockInterviewGradePromptService.build).toHaveBeenCalledWith(
                    expect.objectContaining({
                        mode: MockInterviewMode.Qna,
                        courseExcerpt: "",
                    }),
                )
                expect(result.matchedContentIds).toEqual([])
            })

        it("gates on the shared credit pool and pins the validated lane onto the invoke",
            async () => {
                const harness = makeGradingHarness({
                    session: sessionRow({
                        mode: MockInterviewMode.Design,
                        seedQuestions: null,
                    }),
                })

                await harness.service.grade(gradeParams({
                    selectedModel: "gpt-test",
                    selectedModelProvider: ModelProvider.OpenAI,
                }))

                expect(harness.aiEntitlementService.assertNotOverQuota).toHaveBeenCalledWith({
                    userId: "user-1",
                })
                expect(harness.gradingLaneValidationService.validate).toHaveBeenCalledWith({
                    userId: "user-1",
                    model: "gpt-test",
                    provider: ModelProvider.OpenAI,
                })
                expect(harness.aiInvokeService.run).toHaveBeenCalledWith({
                    userId: "user-1",
                    messages: [],
                    selection: {
                        model: "gpt-test",
                        provider: ModelProvider.OpenAI,
                    },
                    surface: AiCeilSurface.Interview,
                })
            })

        it("charges the serving model before parsing, so a malformed response is never free",
            async () => {
                const harness = makeGradingHarness({
                    session: sessionRow({
                        mode: MockInterviewMode.Design,
                        seedQuestions: null,
                    }),
                    modelText: "the model apologised instead of answering",
                })

                await expect(harness.service.grade(gradeParams()))
                    .rejects.toThrow(ParsingCriteriaResultsFromModelTextException)

                expect(harness.aiEntitlementService.consume).toHaveBeenCalledWith({
                    userId: "user-1",
                    cost: 7,
                    surface: AiCeilSurface.Interview,
                    task: AiModelTask.Grading,
                    model: "gpt-test",
                    provider: ModelProvider.OpenAI,
                    promptTokens: 1200,
                    completionTokens: 340,
                    attempts: 2,
                })
                expect(harness.transactionManager.save).not.toHaveBeenCalledWith(
                    MockInterviewAttemptEntity,
                    expect.anything(),
                )
            })

        it("rejects a near-empty transcript before quota, lane, retrieval, invoke or charge",
            async () => {
                const harness = makeGradingHarness()

                await expect(harness.service.grade(gradeParams({
                    turns: [
                        {
                            role: "interviewer",
                            phase: MockInterviewPhase.Requirements,
                            content: "A very long interviewer prompt that does not count towards the candidate's own answer length at all.",
                        },
                        {
                            role: "candidate",
                            phase: MockInterviewPhase.Requirements,
                            content: "Not sure.",
                        },
                    ],
                }))).rejects.toThrow(MockInterviewSessionTooShortException)

                expect(harness.aiEntitlementService.assertNotOverQuota).not.toHaveBeenCalled()
                expect(harness.aiInvokeService.run).not.toHaveBeenCalled()
            })
    })

/**
 * Where a question carries authored checkpoints and the grader reported which of them
 * the answer established, the score stops being a number the model chose and becomes the
 * sum of the bands it earned. The headline then has to follow, or the scorecard would
 * contradict itself.
 */
describe("MockInterviewGradingService — checkpoint rescoring",
    () => {
        /** A bank question with two checkpoints worth 40 and 60. */
        const checkpointRow = groundingBankRow({
            id: "bank-1",
            checklists: [
                {
                    text: "Explains the index",
                    dimension: "technical",
                    critical: false,
                    scoreBand: 40,
                    sortIndex: 0,
                },
                {
                    text: "Explains the cache",
                    dimension: "technical",
                    critical: false,
                    scoreBand: 60,
                    sortIndex: 1,
                },
            ],
        })

        /** A qna session with two seeds, the second of which has no checkpoints. */
        const twoSeedSession = sessionRow({
            seedQuestions: [
                {
                    cardId: "bank-1",
                    kind: "theory",
                    title: "t",
                    givenCodes: [],
                },
                {
                    cardId: "bank-2",
                    kind: "theory",
                    title: "t",
                    givenCodes: [],
                },
            ],
        })

        it("replaces the model's score with the sum of the covered bands and re-derives the headline",
            async () => {
                const harness = makeGradingHarness({
                    session: twoSeedSession,
                    bankRows: [
                        checkpointRow,
                        groundingBankRow({
                            id: "bank-2",
                        }),
                    ],
                    modelText: JSON.stringify({
                        ...MODEL_SCORECARD,
                        overallScore: 90,
                        phaseScores: [
                            {
                                phase: "q1",
                                score: 90,
                                max: 100,
                            },
                            {
                                phase: "q2",
                                score: 20,
                                max: 100,
                            },
                        ],
                        coveredCheckpoints: [{
                            index: 0,
                            covered: [0],
                        }],
                    }),
                })

                const result = await harness.service.grade(gradeParams())

                expect(result.phaseScores).toEqual([
                    {
                        phase: "q1",
                        score: 40,
                        max: 100,
                    },
                    {
                        phase: "q2",
                        score: 20,
                        max: 100,
                    },
                ])
                // the headline follows the questions it summarises: round((40 + 20) / 2)
                expect(result.overallScore).toBe(30)
            })

        it("keeps the model's own score for a question that carries no checkpoints",
            async () => {
                const harness = makeGradingHarness({
                    session: twoSeedSession,
                    bankRows: [
                        checkpointRow,
                        groundingBankRow({
                            id: "bank-2",
                        }),
                    ],
                    modelText: JSON.stringify({
                        ...MODEL_SCORECARD,
                        overallScore: 88,
                        phaseScores: [
                            {
                                phase: "q1",
                                score: 90,
                                max: 100,
                            },
                            {
                                phase: "q2",
                                score: 88,
                                max: 100,
                            },
                        ],
                        coveredCheckpoints: [
                            {
                                index: 0,
                                covered: [
                                    0,
                                    1,
                                ],
                            },
                            {
                                index: 1,
                                covered: [0],
                            },
                        ],
                    }),
                })

                const result = await harness.service.grade(gradeParams())

                expect(result.phaseScores[1].score).toBe(88)
                expect(result.phaseScores[0].score).toBe(100)
            })

        it("keeps every model score when the grader omitted the coverage report",
            async () => {
                const harness = makeGradingHarness({
                    session: sessionRow({
                        seedQuestions: [{
                            cardId: "bank-1",
                            kind: "theory",
                            title: "t",
                            givenCodes: [],
                        }],
                    }),
                    bankRows: [checkpointRow],
                    modelText: JSON.stringify({
                        ...MODEL_SCORECARD,
                        overallScore: 91,
                        phaseScores: [{
                            phase: "q1",
                            score: 91,
                            max: 100,
                        }],
                        coveredCheckpoints: [],
                    }),
                })

                const result = await harness.service.grade(gradeParams())

                expect(result.phaseScores).toEqual([{
                    phase: "q1",
                    score: 91,
                    max: 100,
                }])
                expect(result.overallScore).toBe(91)
            })

        it("keeps the model's headline for a design session, which has no checkpoints at all",
            async () => {
                const harness = makeGradingHarness({
                    session: sessionRow({
                        mode: MockInterviewMode.Design,
                        seedQuestions: null,
                    }),
                })

                const result = await harness.service.grade(gradeParams())

                expect(result.overallScore).toBe(70)
                expect(result.verdict).toBe("borderline")
            })
    })

/**
 * The per-question review is what a generic chat tool cannot produce: the candidate's
 * own words next to the course's canonical authored answer for the exact same question.
 * A question missing either half still gets a row rather than disappearing from the
 * scorecard.
 */
describe("MockInterviewGradingService — question reviews",
    () => {
        it("pairs each question's transcript with its authored model answer",
            async () => {
                const harness = makeGradingHarness({
                    session: sessionRow({
                        seedQuestions: [{
                            cardId: "bank-1",
                            kind: "theory",
                            title: "t",
                            givenCodes: [],
                        }],
                    }),
                    bankRows: [groundingBankRow({
                        id: "bank-1",
                        idealAnswer: "A B-tree over the column.",
                    })],
                })

                const result = await harness.service.grade(gradeParams())

                expect(result.questionReviews).toEqual([{
                    questionIndex: 0,
                    kind: "theory",
                    question: "How would you absorb the burst?",
                    candidateAnswer: LONG_ANSWER,
                    modelAnswer: "A B-tree over the column.",
                    feedback: "missed the index",
                    score: 70,
                    max: 100,
                    matchedContentId: null,
                }])
            })

        /** Inputs `buildReviews` forwards to the private review builder it reaches into. */
        interface BuildReviewsParams {
            turns: Array<MockInterviewTurnRecord>
            seedGroundings: Array<MockInterviewSeedGrounding>
            phaseScores: Array<MockInterviewPhaseScore>
            questionFeedback: Array<{ index: number, feedback: string }>
            matchedContentIds: Array<string>
        }

        /** Reaches the private review builder for the combinations a full grade cannot stage. */
        const buildReviews = (
            params: BuildReviewsParams,
        ): Array<MockInterviewQuestionReview> => {
            const harness = makeGradingHarness()
            return (harness.service as unknown as {
                buildQuestionReviews: (input: typeof params) => Array<MockInterviewQuestionReview>
            }).buildQuestionReviews(params)
        }

        /** One resolved grounding for the given index. */
        const grounding = (
            cardId: string,
            question: string,
            answer: string | null,
        ): MockInterviewSeedGrounding => ({
            cardId,
            kind: "reasoning",
            question,
            answer,
            keywords: [],
        })

        it("attaches the session's best-ranked lesson to every question that resolved a grounding",
            () => {
                const reviews = buildReviews({
                    turns: [
                        {
                            role: "interviewer",
                            phase: MockInterviewPhase.Requirements,
                            content: "Q0?",
                            questionIndex: 0,
                        },
                        {
                            role: "candidate",
                            phase: MockInterviewPhase.Requirements,
                            content: "A0.",
                            questionIndex: 0,
                        },
                        {
                            role: "candidate",
                            phase: MockInterviewPhase.Requirements,
                            content: "still A0.",
                            questionIndex: 0,
                        },
                        {
                            role: "interviewer",
                            phase: MockInterviewPhase.Requirements,
                            content: "Q1?",
                            questionIndex: 1,
                        },
                    ],
                    seedGroundings: [grounding("card-0",
                        "seed question 0",
                        "model answer 0")],
                    phaseScores: [{
                        phase: "q0",
                        score: 55,
                        max: 80,
                    }],
                    questionFeedback: [{
                        index: 0,
                        feedback: "add the tradeoff",
                    }],
                    matchedContentIds: ["content-42",
                        "content-43"],
                })

                expect(reviews).toEqual([
                    {
                        questionIndex: 0,
                        kind: "reasoning",
                        question: "Q0?",
                        candidateAnswer: "A0. still A0.",
                        modelAnswer: "model answer 0",
                        feedback: "add the tradeoff",
                        score: 55,
                        max: 80,
                        matchedContentId: "content-42",
                    },
                    // no grounding resolved for index 1 -- no invented lesson link, no
                    // model answer, and the default score/max stand in
                    {
                        questionIndex: 1,
                        kind: "theory",
                        question: "Q1?",
                        candidateAnswer: "",
                        modelAnswer: null,
                        feedback: "",
                        score: 0,
                        max: 100,
                        matchedContentId: null,
                    },
                ])
            })

        it("falls back to the seed's own question text when no interviewer turn was tagged",
            () => {
                const reviews = buildReviews({
                    turns: [{
                        role: "candidate",
                        phase: MockInterviewPhase.Requirements,
                        content: "my answer",
                        questionIndex: 0,
                    }],
                    seedGroundings: [grounding("card-0",
                        "seed question 0",
                        null)],
                    phaseScores: [],
                    questionFeedback: [],
                    matchedContentIds: [],
                })

                expect(reviews).toEqual([{
                    questionIndex: 0,
                    kind: "reasoning",
                    question: "seed question 0",
                    candidateAnswer: "my answer",
                    modelAnswer: null,
                    feedback: "",
                    score: 0,
                    max: 100,
                    matchedContentId: null,
                }])
            })

        it("spans every resolved grounding even when the transcript recorded no turns",
            () => {
                const reviews = buildReviews({
                    turns: [{
                        role: "candidate",
                        phase: MockInterviewPhase.Requirements,
                        content: "an untagged turn belongs to no question",
                    }],
                    seedGroundings: [
                        grounding("card-0",
                            "seed question 0",
                            "answer 0"),
                        grounding("card-1",
                            "",
                            "answer 1"),
                    ],
                    phaseScores: [],
                    questionFeedback: [],
                    matchedContentIds: [],
                })

                expect(reviews).toHaveLength(2)
                expect(reviews[0].question).toBe("seed question 0")
                // neither a transcript question nor a seed question -- an empty string,
                // never a fabricated one
                expect(reviews[1].question).toBe("")
                expect(reviews[1].candidateAnswer).toBe("")
            })
    })

/**
 * A graded session leaves two durable marks in one transaction: the attempt row that
 * later replays the result, and the session flipped out of "in progress" so it stops
 * being offered for resume. A response must never claim success with either half missing.
 */
describe("MockInterviewGradingService — persisted attempt",
    () => {
        it("writes the attempt and closes its session in the same transaction",
            async () => {
                const harness = makeGradingHarness({
                    session: sessionRow({
                        mode: MockInterviewMode.Design,
                        seedQuestions: null,
                    }),
                })

                const result = await harness.service.grade(gradeParams())

                expect(harness.entityManager.transaction).toHaveBeenCalledTimes(2)
                expect(harness.transactionManager.save).toHaveBeenCalledWith(
                    MockInterviewAttemptEntity,
                    expect.objectContaining({
                        enrollment: GRADE_ENROLLMENT,
                        sessionId: "session-1",
                        overallScore: result.overallScore,
                        verdict: result.verdict,
                        phaseScores: [{
                            phase: "requirements",
                            score: 70,
                            max: 100,
                        }],
                        attributeScores: [{
                            key: "communication",
                            score: 65,
                        }],
                        strengths: ["named the bottleneck"],
                        gaps: ["no capacity estimate"],
                        followUpQuestion: "How would you shard it?",
                        matchedContentIds: [
                            "content-1",
                            "content-2",
                        ],
                        questionReviews: [],
                    }),
                )
                expect(harness.transactionManager.update).toHaveBeenCalledWith(
                    MockInterviewSessionEntity,
                    {
                        id: "session-1",
                        enrollment: {
                            id: GRADE_ENROLLMENT.id,
                        },
                    },
                    expect.objectContaining({
                        status: "completed",
                        completedAt: expect.any(Date),
                        revision: expect.any(Function),
                    }),
                )
            })
    })
