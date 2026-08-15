import {
    MockInterviewGradingService,
} from "./grade-mock-interview-session-grading.service"
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
