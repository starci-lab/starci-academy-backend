import {
    FindOperator,
} from "typeorm"
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
    MyMockInterviewAttemptsService,
} from "./my-mock-interview-attempts.service"

/** The viewer whose history is being listed. */
const USER_ID = "user-1"

/** The course the history is scoped to. */
const COURSE_ID = "course-1"

/** A fully-populated persisted attempt row. */
const attemptRow = (
    overrides: Record<string, unknown> = {
    },
) => ({
    id: "attempt-1",
    sessionId: "session-1",
    promptId: "prompt-1",
    promptTitle: "Design a queue",
    level: "middle",
    mode: "qna",
    overallScore: 72,
    verdict: "borderline",
    phaseScores: [{
        phase: "requirements",
        score: 72,
        max: 100,
    }],
    attributeScores: [{
        key: "communication",
        score: 65,
    }],
    strengths: ["named the bottleneck"],
    gaps: ["no capacity estimate"],
    followUpQuestion: "How would you shard it?",
    matchedContentIds: ["content-1"],
    questionReviews: [{
        questionIndex: 0,
        kind: "theory",
        question: "What is an index?",
        candidateAnswer: "A lookup structure.",
        modelAnswer: "A B-tree over a column.",
        feedback: "Name the structure.",
        score: 72,
        max: 100,
        matchedContentId: "content-1",
    }],
    createdAt: new Date("2026-08-01T00:00:00.000Z"),
    name: "Friday practice",
    ...overrides,
})

/**
 * The scorecard's history list. Two things matter beyond the mapping: attempts are
 * reached through the ENROLLMENT relation (user x course), which is how every
 * course-scoped read in this codebase keys; and a legacy or half-written jsonb row
 * must cost only its own entry, never null out the whole page for everyone else.
 */
describe("MyMockInterviewAttemptsService",
    () => {
        let entityManager: EntityManagerMock
        let service: MyMockInterviewAttemptsService

        /** The find options the service issued for the single call under test. */
        const issuedOptions = (): {
            where: Record<string, unknown>
            take: number
            skip: number
            order: Record<string, unknown>
        } => {
            const calls = entityManager.findAndCount.mock.calls as unknown as Array<[
                unknown,
                {
                    where: Record<string, unknown>
                    take: number
                    skip: number
                    order: Record<string, unknown>
                },
            ]>
            return calls[0][1]
        }

        beforeEach(() => {
            entityManager = makeEntityManagerMock()
            service = new MyMockInterviewAttemptsService(entityManager as never)
        })

        it("reaches the viewer's attempts through the enrollment relation, newest first",
            async () => {
                entityManager.findAndCount.mockResolvedValue([
                    [attemptRow()],
                    1,
                ])

                const result = await service.list({
                    userId: USER_ID,
                    courseId: COURSE_ID,
                    limit: 10,
                    offset: 20,
                })

                expect(entityManager.findAndCount).toHaveBeenCalledWith(
                    MockInterviewAttemptEntity,
                    expect.anything(),
                )
                const options = issuedOptions()
                expect(options.where.enrollment).toEqual({
                    user: {
                        id: USER_ID,
                    },
                    course: {
                        id: COURSE_ID,
                    },
                })
                expect(options.order).toEqual({
                    createdAt: "DESC",
                })
                expect(options.take).toBe(10)
                expect(options.skip).toBe(20)
                expect(result.totalCount).toBe(1)
            })

        it("maps a well-formed attempt straight through",
            async () => {
                const row = attemptRow()
                entityManager.findAndCount.mockResolvedValue([
                    [row],
                    1,
                ])

                const result = await service.list({
                    userId: USER_ID,
                    courseId: COURSE_ID,
                    limit: 10,
                    offset: 0,
                })

                expect(result.items).toEqual([{
                    id: "attempt-1",
                    sessionId: "session-1",
                    promptId: "prompt-1",
                    promptTitle: "Design a queue",
                    level: "middle",
                    mode: "qna",
                    overallScore: 72,
                    verdict: "borderline",
                    phaseScores: [{
                        phase: "requirements",
                        score: 72,
                        max: 100,
                    }],
                    attributeScores: [{
                        key: "communication",
                        score: 65,
                    }],
                    strengths: ["named the bottleneck"],
                    gaps: ["no capacity estimate"],
                    followUpQuestion: "How would you shard it?",
                    matchedContentIds: ["content-1"],
                    questionReviews: [{
                        questionIndex: 0,
                        kind: "theory",
                        question: "What is an index?",
                        candidateAnswer: "A lookup structure.",
                        modelAnswer: "A B-tree over a column.",
                        feedback: "Name the structure.",
                        score: 72,
                        max: 100,
                        matchedContentId: "content-1",
                    }],
                    createdAt: new Date("2026-08-01T00:00:00.000Z"),
                    name: "Friday practice",
                }])
            })

        it("includes legacy null-mode attempts when the caller filters for design",
            async () => {
                entityManager.findAndCount.mockResolvedValue([
                    [],
                    0,
                ])

                await service.list({
                    userId: USER_ID,
                    courseId: COURSE_ID,
                    limit: 10,
                    offset: 0,
                    mode: "design",
                })

                const modeFilter = issuedOptions().where.mode as FindOperator<string>
                expect(modeFilter).toBeInstanceOf(FindOperator)
                expect(modeFilter.type).toBe("or")
                // a plain equality would silently drop every attempt graded before the
                // mode split, which could only ever have been a design session
                const [
                    equality,
                    nullness,
                ] = modeFilter.value as unknown as Array<FindOperator<string>>
                expect(equality.type).toBe("equal")
                expect(equality.value).toBe("design")
                expect(nullness.type).toBe("isNull")
            })

        it("filters on plain equality for any other mode",
            async () => {
                entityManager.findAndCount.mockResolvedValue([
                    [],
                    0,
                ])

                await service.list({
                    userId: USER_ID,
                    courseId: COURSE_ID,
                    limit: 10,
                    offset: 0,
                    mode: "qna",
                })

                const modeFilter = issuedOptions().where.mode as FindOperator<string>
                expect(modeFilter.type).toBe("equal")
                expect(modeFilter.value).toBe("qna")
            })

        it("applies no mode filter at all when the caller asked for none",
            async () => {
                entityManager.findAndCount.mockResolvedValue([
                    [],
                    0,
                ])

                await service.list({
                    userId: USER_ID,
                    courseId: COURSE_ID,
                    limit: 10,
                    offset: 0,
                })

                expect(issuedOptions().where.mode).toBeUndefined()
            })

        it("drops only the unlabelled score entries, keeping the rest of the row",
            async () => {
                entityManager.findAndCount.mockResolvedValue([
                    [attemptRow({
                        phaseScores: [
                            {
                                phase: "",
                                score: 10,
                                max: 20,
                            },
                            {
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
                                key: null,
                                score: 10,
                            },
                            {
                                key: "communication",
                                score: 50,
                            },
                        ],
                        questionReviews: [
                            {
                                kind: 7,
                                score: 10,
                            },
                            {
                                kind: "theory",
                                questionIndex: 1,
                                score: 60,
                                max: 100,
                            },
                        ],
                    })],
                    1,
                ])

                const [item] = (await service.list({
                    userId: USER_ID,
                    courseId: COURSE_ID,
                    limit: 10,
                    offset: 0,
                })).items

                expect(item.phaseScores).toEqual([{
                    phase: "requirements",
                    score: 30,
                    max: 40,
                }])
                expect(item.attributeScores).toEqual([{
                    key: "communication",
                    score: 50,
                }])
                expect(item.questionReviews).toHaveLength(1)
                expect(item.questionReviews[0].kind).toBe("theory")
            })

        it("substitutes defaults for missing numbers and text rather than dropping the entry",
            async () => {
                entityManager.findAndCount.mockResolvedValue([
                    [attemptRow({
                        phaseScores: [{
                            phase: "requirements",
                            score: "not a number",
                            max: null,
                        }],
                        attributeScores: [{
                            key: "communication",
                            score: undefined,
                        }],
                        questionReviews: [{
                            kind: "theory",
                            questionIndex: Number.NaN,
                            question: null,
                            candidateAnswer: 42,
                            modelAnswer: 7,
                            feedback: undefined,
                            score: "x",
                            max: "y",
                            matchedContentId: 99,
                        }],
                    })],
                    1,
                ])

                const [item] = (await service.list({
                    userId: USER_ID,
                    courseId: COURSE_ID,
                    limit: 10,
                    offset: 0,
                })).items

                expect(item.phaseScores).toEqual([{
                    phase: "requirements",
                    score: 0,
                    max: 100,
                }])
                expect(item.attributeScores).toEqual([{
                    key: "communication",
                    score: 0,
                }])
                expect(item.questionReviews).toEqual([{
                    questionIndex: 0,
                    kind: "theory",
                    question: "",
                    candidateAnswer: "",
                    // a non-string model answer is reported as absent, never rendered
                    modelAnswer: null,
                    feedback: "",
                    score: 0,
                    max: 100,
                    matchedContentId: null,
                }])
            })

        it("returns an empty page without touching the mapper when the viewer has no attempts",
            async () => {
                entityManager.findAndCount.mockResolvedValue([
                    [],
                    0,
                ])

                const result = await service.list({
                    userId: USER_ID,
                    courseId: COURSE_ID,
                    limit: 10,
                    offset: 0,
                })

                expect(result).toEqual({
                    totalCount: 0,
                    items: [],
                })
            })
    })
