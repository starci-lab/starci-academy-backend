import {
    MockInterviewAttemptEntity,
} from "@modules/databases/postgresql/primary/entities/mock-interview-attempt.entity"
import {
    makeEntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import type {
    EntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import {
    MyMockInterviewAttemptBySessionService,
} from "./my-mock-interview-attempt-by-session.service"

/** The viewer recovering their own finished session. */
const USER_ID = "user-1"

/** The course the session belongs to. */
const COURSE_ID = "course-1"

/** The session whose graded result is being recovered. */
const SESSION_ID = "session-1"

/** A fully-populated persisted attempt row. */
const attemptRow = (
    overrides: Record<string, unknown> = {
    },
) => ({
    id: "attempt-1",
    sessionId: SESSION_ID,
    promptId: "prompt-1",
    promptTitle: "Design a queue",
    level: "senior",
    mode: "qna",
    overallScore: 81,
    verdict: "pass",
    phaseScores: [{
        phase: "requirements",
        score: 81,
        max: 100,
    }],
    attributeScores: [{
        key: "communication",
        score: 78,
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
        score: 81,
        max: 100,
        matchedContentId: "content-7",
    }],
    createdAt: new Date("2026-08-01T00:00:00.000Z"),
    name: "Friday practice",
    ...overrides,
})

/**
 * Recovering one finished session's scorecard when a resume lands on a session that
 * is no longer in progress. The lookup is scoped to the viewer's own enrollment as
 * well as the session id, so guessing another learner's session id can never return
 * their result.
 */
describe("MyMockInterviewAttemptBySessionService",
    () => {
        let entityManager: EntityManagerMock
        let service: MyMockInterviewAttemptBySessionService

        beforeEach(() => {
            entityManager = makeEntityManagerMock()
            service = new MyMockInterviewAttemptBySessionService(entityManager as never)
        })

        it("scopes the lookup to the viewer's own enrollment, not the session id alone",
            async () => {
                entityManager.findOne.mockResolvedValue(attemptRow())

                await service.find({
                    userId: USER_ID,
                    courseId: COURSE_ID,
                    sessionId: SESSION_ID,
                })

                expect(entityManager.findOne).toHaveBeenCalledWith(
                    MockInterviewAttemptEntity,
                    {
                        where: {
                            sessionId: SESSION_ID,
                            enrollment: {
                                user: {
                                    id: USER_ID,
                                },
                                course: {
                                    id: COURSE_ID,
                                },
                            },
                        },
                    },
                )
            })

        it("reports nothing when the session has no graded attempt for this viewer",
            async () => {
                entityManager.findOne.mockResolvedValue(null)

                const result = await service.find({
                    userId: USER_ID,
                    courseId: COURSE_ID,
                    sessionId: "someone-elses-session",
                })

                expect(result).toBeNull()
            })

        it("returns the graded attempt in full",
            async () => {
                entityManager.findOne.mockResolvedValue(attemptRow())

                const result = await service.find({
                    userId: USER_ID,
                    courseId: COURSE_ID,
                    sessionId: SESSION_ID,
                })

                expect(result).toEqual({
                    id: "attempt-1",
                    sessionId: SESSION_ID,
                    promptId: "prompt-1",
                    promptTitle: "Design a queue",
                    level: "senior",
                    mode: "qna",
                    overallScore: 81,
                    verdict: "pass",
                    phaseScores: [{
                        phase: "requirements",
                        score: 81,
                        max: 100,
                    }],
                    attributeScores: [{
                        key: "communication",
                        score: 78,
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
                        score: 81,
                        max: 100,
                        matchedContentId: "content-7",
                    }],
                    createdAt: new Date("2026-08-01T00:00:00.000Z"),
                    name: "Friday practice",
                })
            })

        it("drops only the unlabelled score entries from a half-written row",
            async () => {
                entityManager.findOne.mockResolvedValue(attemptRow({
                    phaseScores: [
                        {
                            phase: "",
                            score: 10,
                            max: 20,
                        },
                        {
                            phase: "requirements",
                            score: 30,
                            max: 40,
                        },
                    ],
                    attributeScores: [
                        {
                            key: 7,
                            score: 10,
                        },
                        {
                            key: "communication",
                            score: 50,
                        },
                    ],
                    questionReviews: [
                        {
                            kind: null,
                            score: 10,
                        },
                        {
                            kind: "reasoning",
                            questionIndex: 2,
                            score: 60,
                            max: 100,
                        },
                    ],
                }))

                const result = await service.find({
                    userId: USER_ID,
                    courseId: COURSE_ID,
                    sessionId: SESSION_ID,
                })

                expect(result?.phaseScores).toEqual([{
                    phase: "requirements",
                    score: 30,
                    max: 40,
                }])
                expect(result?.attributeScores).toEqual([{
                    key: "communication",
                    score: 50,
                }])
                expect(result?.questionReviews).toHaveLength(1)
                expect(result?.questionReviews[0].kind).toBe("reasoning")
            })

        it("substitutes defaults for missing numbers and text rather than dropping the entry",
            async () => {
                entityManager.findOne.mockResolvedValue(attemptRow({
                    phaseScores: [{
                        phase: "requirements",
                        score: "not a number",
                        max: null,
                    }],
                    attributeScores: [{
                        key: "communication",
                        score: Number.POSITIVE_INFINITY,
                    }],
                    questionReviews: [{
                        kind: "theory",
                        questionIndex: undefined,
                        question: 5,
                        candidateAnswer: null,
                        modelAnswer: {
                        },
                        feedback: false,
                        score: "x",
                        max: undefined,
                        matchedContentId: 99,
                    }],
                }))

                const result = await service.find({
                    userId: USER_ID,
                    courseId: COURSE_ID,
                    sessionId: SESSION_ID,
                })

                expect(result?.phaseScores).toEqual([{
                    phase: "requirements",
                    score: 0,
                    max: 100,
                }])
                // an infinite score is not a finite number -- it falls back, never renders
                expect(result?.attributeScores).toEqual([{
                    key: "communication",
                    score: 0,
                }])
                expect(result?.questionReviews).toEqual([{
                    questionIndex: 0,
                    kind: "theory",
                    question: "",
                    candidateAnswer: "",
                    modelAnswer: null,
                    feedback: "",
                    score: 0,
                    max: 100,
                    matchedContentId: null,
                }])
            })
    })
