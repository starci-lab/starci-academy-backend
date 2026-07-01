import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    EnrollmentEntity,
    InterviewAttemptEntity,
} from "@modules/databases"
import {
    makeEntityManagerMock,
} from "@modules/tests"
import type {
    EntityManagerMock,
} from "@modules/tests"
import {
    InterviewHistoryService,
} from "./interview-history.service"
import {
    InterviewVerdict,
} from "./types/interview-grade"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

describe("InterviewHistoryService",
    () => {
        let module: TestingModule
        let service: InterviewHistoryService
        let entityManager: EntityManagerMock

        const userId = "user-1"
        const courseId = "course-1"
        const flashcardDeckId = "deck-1"

        /** Build an attempt row with sane defaults the tests override per-case. */
        const makeAttempt = (
            overrides: Partial<InterviewAttemptEntity> = {},
        ): InterviewAttemptEntity =>
            ({
                id: "attempt-x",
                score: 50,
                verdict: InterviewVerdict.Pass,
                level: null,
                tags: [],
                strengths: [],
                gaps: [],
                modelAnswerHint: null,
                interviewSessionId: null,
                flashcardCard: undefined,
                createdAt: new Date("2026-01-01T00:00:00Z"),
                ...overrides,
            } as unknown as InterviewAttemptEntity)

        beforeEach(async () => {
            entityManager = makeEntityManagerMock()

            module = await Test.createTestingModule({
                providers: [
                    InterviewHistoryService,
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                ],
            }).compile()

            service = module.get<InterviewHistoryService>(InterviewHistoryService)
        })

        afterEach(async () => {
            await module.close()
        })

        describe("getSummary",
            () => {
                it("returns a zeroed summary when the user has no attempts",
                    async () => {
                        entityManager.find.mockResolvedValueOnce([])

                        const summary = await service.getSummary({
                            userId,
                        })

                        expect(summary).toEqual({
                            totalAnswered: 0,
                            averageScore: 0,
                            bestScore: 0,
                            passCount: 0,
                            borderlineCount: 0,
                            failCount: 0,
                            weakTags: [],
                            lastAttemptAt: null,
                        })
                    })

                it("aggregates score, verdict counts, weak tags, and last-attempt from the scan window",
                    async () => {
                        const newest = new Date("2026-02-03T00:00:00Z")
                        // newest-first order (as the query returns)
                        entityManager.find.mockResolvedValueOnce([
                            makeAttempt({
                                score: 90,
                                verdict: InterviewVerdict.Pass,
                                tags: [
                                    "sql",
                                ],
                                createdAt: newest,
                            }),
                            makeAttempt({
                                score: 40,
                                verdict: InterviewVerdict.Fail,
                                tags: [
                                    "sql",
                                    "indexing",
                                ],
                                createdAt: new Date("2026-02-02T00:00:00Z"),
                            }),
                            makeAttempt({
                                score: 60,
                                verdict: InterviewVerdict.Borderline,
                                tags: [
                                    "sql",
                                ],
                                createdAt: new Date("2026-02-01T00:00:00Z"),
                            }),
                        ])

                        const summary = await service.getSummary({
                            userId,
                        })

                        expect(summary.totalAnswered).toBe(3)
                        // (90 + 40 + 60) / 3 = 63.33… → rounded to one decimal
                        expect(summary.averageScore).toBe(63.3)
                        expect(summary.bestScore).toBe(90)
                        expect(summary.passCount).toBe(1)
                        expect(summary.borderlineCount).toBe(1)
                        expect(summary.failCount).toBe(1)
                        // weak tags = tags of NON-passed attempts, most frequent first
                        expect(summary.weakTags).toEqual([
                            "sql",
                            "indexing",
                        ])
                        // newest-first head is the most recent attempt
                        expect(summary.lastAttemptAt).toBe(newest)
                    })

                it("scopes by deck + user when a deckId is given (deck takes precedence)",
                    async () => {
                        entityManager.find.mockResolvedValueOnce([])

                        await service.getSummary({
                            userId,
                            flashcardDeckId,
                            courseId,
                        })

                        // enrollment is NOT resolved for a deck-scoped read
                        expect(entityManager.findOne).not.toHaveBeenCalled()
                        const [
                            entity,
                            options,
                        ] = entityManager.find.mock.calls[0]
                        expect(entity).toBe(InterviewAttemptEntity)
                        expect(options.where).toMatchObject({
                            userId,
                            flashcardDeckId,
                        })
                    })

                it("resolves the enrollment and scopes by it for a course-wide read",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce({
                            id: "enrollment-9",
                        })
                        entityManager.find.mockResolvedValueOnce([])

                        await service.getSummary({
                            userId,
                            courseId,
                        })

                        // enrollment looked up read-only for this user × course
                        expect(entityManager.findOne).toHaveBeenCalledWith(
                            EnrollmentEntity,
                            expect.objectContaining({
                                where: {
                                    user: {
                                        id: userId,
                                    },
                                    course: {
                                        id: courseId,
                                    },
                                },
                            }),
                        )
                        const [
                            ,
                            options,
                        ] = entityManager.find.mock.calls[0]
                        // keyed by the enrollment relation, not user_id
                        expect(options.where).toMatchObject({
                            enrollment: {
                                id: "enrollment-9",
                            },
                        })
                    })

                it("short-circuits to a zeroed summary (no attempt scan) when the course has no enrollment",
                    async () => {
                        // findOne defaults to null → no enrollment
                        const summary = await service.getSummary({
                            userId,
                            courseId,
                        })

                        expect(summary.totalAnswered).toBe(0)
                        // never scans attempts when there is nothing in scope
                        expect(entityManager.find).not.toHaveBeenCalled()
                    })
            })

        describe("getSessions",
            () => {
                it("groups attempts sharing a session id into one run summary",
                    async () => {
                        entityManager.find.mockResolvedValueOnce([
                            makeAttempt({
                                id: "a1",
                                interviewSessionId: "run-1",
                                score: 80,
                                verdict: InterviewVerdict.Pass,
                                level: "senior",
                                createdAt: new Date("2026-03-01T10:00:00Z"),
                            }),
                            makeAttempt({
                                id: "a2",
                                interviewSessionId: "run-1",
                                score: 60,
                                verdict: InterviewVerdict.Borderline,
                                level: "senior",
                                createdAt: new Date("2026-03-01T09:00:00Z"),
                            }),
                        ])

                        const page = await service.getSessions({
                            userId,
                            limit: 10,
                            offset: 0,
                        })

                        expect(page.totalCount).toBe(1)
                        expect(page.items).toHaveLength(1)
                        const run = page.items[0]
                        expect(run.sessionId).toBe("run-1")
                        expect(run.questionCount).toBe(2)
                        expect(run.averageScore).toBe(70)
                        expect(run.bestScore).toBe(80)
                        expect(run.passCount).toBe(1)
                        expect(run.borderlineCount).toBe(1)
                        expect(run.level).toBe("senior")
                        // run started at the earliest attempt
                        expect(run.startedAt).toEqual(new Date("2026-03-01T09:00:00Z"))
                    })

                it("returns an empty page when a course scope has no enrollment",
                    async () => {
                        // findOne null → no enrollment → null scope
                        const page = await service.getSessions({
                            userId,
                            courseId,
                            limit: 10,
                            offset: 0,
                        })

                        expect(page).toEqual({
                            items: [],
                            totalCount: 0,
                        })
                        expect(entityManager.find).not.toHaveBeenCalled()
                    })
            })

        describe("getSessionAttempts",
            () => {
                it("reads one run's answers in order and joins the question from the card",
                    async () => {
                        entityManager.find.mockResolvedValueOnce([
                            makeAttempt({
                                id: "a1",
                                score: 75,
                                verdict: InterviewVerdict.Pass,
                                level: "middle",
                                tags: [
                                    "redis",
                                ],
                                strengths: [
                                    "explained eviction",
                                ],
                                gaps: [],
                                modelAnswerHint: "mention TTL",
                                flashcardCard: {
                                    question: "How does Redis evict keys?",
                                } as unknown as InterviewAttemptEntity["flashcardCard"],
                            }),
                        ])

                        const attempts = await service.getSessionAttempts({
                            userId,
                            sessionId: "run-1",
                        })

                        expect(attempts).toHaveLength(1)
                        expect(attempts[0]).toMatchObject({
                            id: "a1",
                            score: 75,
                            verdict: InterviewVerdict.Pass,
                            level: "middle",
                            tags: [
                                "redis",
                            ],
                            question: "How does Redis evict keys?",
                            strengths: [
                                "explained eviction",
                            ],
                            gaps: [],
                            modelAnswerHint: "mention TTL",
                        })

                        // the read filters by the session id and eager-loads the card
                        const [
                            entity,
                            options,
                        ] = entityManager.find.mock.calls[0]
                        expect(entity).toBe(InterviewAttemptEntity)
                        expect(options.where).toMatchObject({
                            userId,
                            interviewSessionId: "run-1",
                        })
                        expect(options.relations).toMatchObject({
                            flashcardCard: true,
                        })
                    })

                it("defaults a legacy row's missing question/feedback to empty values",
                    async () => {
                        entityManager.find.mockResolvedValueOnce([
                            makeAttempt({
                                id: "legacy",
                                score: 50,
                                tags: undefined as unknown as Array<string>,
                                strengths: undefined as unknown as Array<string>,
                                gaps: undefined as unknown as Array<string>,
                                modelAnswerHint: undefined as unknown as string,
                                flashcardCard: undefined,
                            }),
                        ])

                        const attempts = await service.getSessionAttempts({
                            userId,
                            sessionId: "run-1",
                        })

                        expect(attempts[0]).toMatchObject({
                            question: "",
                            tags: [],
                            strengths: [],
                            gaps: [],
                            modelAnswerHint: null,
                        })
                    })
            })
    })
