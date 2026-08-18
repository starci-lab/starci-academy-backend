import {
    Test,
} from "@nestjs/testing"
import type {
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    ContentEntity,
} from "@modules/databases/postgresql/primary/entities/content.entity"
import {
    FlashcardCardEntity,
} from "@modules/databases/postgresql/primary/entities/flashcard-card.entity"
import {
    FlashcardQuizSessionEntity,
} from "@modules/databases/postgresql/primary/entities/flashcard-quiz-session.entity"
import {
    XpHistoryEntity,
} from "@modules/databases/postgresql/primary/entities/xp-history.entity"
import {
    XpSource,
} from "@modules/databases/postgresql/primary/enums/xp-source"
import {
    CourseRagRetrievalService,
} from "@modules/integrations/rag/course-rag-retrieval.service"
import {
    writeXpHistory,
} from "@features/api/processors/ai/shared/xp/write-xp-history"
import {
    asEntityManager,
    makeEntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import type {
    EntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import {
    UserFlashcardStatsProjectionService,
} from "../projections/user-flashcard-stats/user-flashcard-stats-projection.service"
import {
    FlashcardQuizSessionService,
} from "./flashcard-quiz-session.service"

// the XP ledger writer is a shared helper with its own suite; stub it so this
// spec asserts the grant this service decides on, not the ledger's internals
jest.mock("@features/api/processors/ai/shared/xp/write-xp-history",
    () => ({
        writeXpHistory: jest.fn().mockResolvedValue(undefined),
    }))

// the projection service is owned by its own suite; only its read is needed here
jest.mock("../projections/user-flashcard-stats/user-flashcard-stats-projection.service",
    () => ({
        UserFlashcardStatsProjectionService: class {
        },
    }))

const writeXpHistoryMock = writeXpHistory as jest.MockedFunction<
    typeof writeXpHistory
>

/** The caller in every test. */
const USER_ID = "user-1"
/** The course the quiz belongs to. */
const COURSE_ID = "course-1"
/** The server-issued draw id being completed. */
const SESSION_ID = "session-1"

describe("FlashcardQuizSessionService",
    () => {
        let testingModule: TestingModule
        let service: FlashcardQuizSessionService
        let entityManager: EntityManagerMock
        let statsService: {
            getStats: jest.Mock
        }
        let ragService: {
            searchCourse: jest.Mock
        }
        /** Raw sum the daily-cap query returns; each test dials it. */
        let grantedToday: string

        /**
         * Build one answered-card payload.
         *
         * @param cardId - The answered card
         * @param correctBlanks - Blanks the learner filled correctly
         * @param totalBlanks - Blanks the card carries
         * @returns The answer the client submits
         */
        const answer = (
            cardId: string,
            correctBlanks: number,
            totalBlanks: number,
        ) => ({
            cardId,
            correctBlanks,
            totalBlanks,
        })

        beforeEach(async () => {
            jest.clearAllMocks()
            grantedToday = "0"

            entityManager = makeEntityManagerMock()
            entityManager.find.mockResolvedValue([])
            entityManager.findOne.mockResolvedValue(null)
            entityManager.createQueryBuilder().getRawOne.mockImplementation(
                async () => ({
                    sum: grantedToday,
                }),
            )

            statsService = {
                getStats: jest.fn().mockResolvedValue({
                    retentionRate: 55,
                }),
            }
            ragService = {
                searchCourse: jest.fn().mockResolvedValue({
                    hits: [],
                }),
            }

            testingModule = await Test.createTestingModule({
                providers: [
                    FlashcardQuizSessionService,
                    {
                        provide: getEntityManagerToken("primary"),
                        useValue: asEntityManager(entityManager),
                    },
                    {
                        provide: UserFlashcardStatsProjectionService,
                        useValue: statsService,
                    },
                    {
                        provide: CourseRagRetrievalService,
                        useValue: ragService,
                    },
                ],
            }).compile()

            service = testingModule.get(FlashcardQuizSessionService)
        })

        afterEach(async () => {
            await testingModule.close()
        })

        describe("XP grant",
            () => {
                it("derives the reward from server-side coverage, not client score",
                    async () => {
                        const result = await service.complete({
                            userId: USER_ID,
                            sessionId: SESSION_ID,
                            courseId: COURSE_ID,
                            answers: [
                                answer("card-a",
                                    2,
                                    2),
                                answer("card-b",
                                    1,
                                    2),
                            ],
                        })

                        // coverage = (1.0 + 0.5) / 2 = 0.75 -> round(0.75 * 2 * 3) = 5
                        expect(result.xpEarned).toBe(5)
                        expect(result.dailyCapReached).toBe(false)
                        expect(writeXpHistoryMock).toHaveBeenCalledWith(
                            expect.objectContaining({
                                userId: USER_ID,
                                courseId: COURSE_ID,
                                source: XpSource.FlashcardQuiz,
                                amount: 5,
                                points: 5,
                                refId: SESSION_ID,
                            }),
                        )
                    })

                it("grants nothing for an empty answer list",
                    async () => {
                        const result = await service.complete({
                            userId: USER_ID,
                            sessionId: SESSION_ID,
                            courseId: COURSE_ID,
                            answers: [],
                        })

                        expect(result.xpEarned).toBe(0)
                        expect(result.dailyCapReached).toBe(true)
                        expect(writeXpHistoryMock).not.toHaveBeenCalled()
                    })

                it("clamps an oversized answers array to the per-session ceiling",
                    async () => {
                        const answers = Array.from({
                            length: 40,
                        },
                        (_unused, index) => answer(`card-${index}`,
                            1,
                            1))

                        const result = await service.complete({
                            userId: USER_ID,
                            sessionId: SESSION_ID,
                            courseId: COURSE_ID,
                            answers,
                        })

                        // 10 cards x full coverage x 3 = 30, capped at 15 per session
                        expect(result.xpEarned).toBe(15)
                    })

                it("ignores nonsensical blank counts a spoofed client sends",
                    async () => {
                        const result = await service.complete({
                            userId: USER_ID,
                            sessionId: SESSION_ID,
                            courseId: COURSE_ID,
                            answers: [
                                // correct above total is clamped down to total
                                answer("card-a",
                                    99,
                                    2),
                                // negative counts floor at zero
                                answer("card-b",
                                    -5,
                                    4),
                                // a card with no blanks contributes zero, never NaN
                                answer("card-c",
                                    3,
                                    0),
                                // a negative total is floored to zero as well
                                answer("card-d",
                                    1,
                                    -3),
                            ],
                        })

                        // coverage = (1 + 0 + 0 + 0) / 4 = 0.25 -> round(0.25 * 4 * 3) = 3
                        expect(result.xpEarned).toBe(3)
                    })

                it("credits nothing on a replay of an already-rewarded session",
                    async () => {
                        entityManager.findOne.mockImplementation(
                            async (entityClass: {
                                name: string
                            }) => entityClass.name === XpHistoryEntity.name
                                ? {
                                    id: "ledger-row",
                                }
                                : null,
                        )

                        const result = await service.complete({
                            userId: USER_ID,
                            sessionId: SESSION_ID,
                            courseId: COURSE_ID,
                            answers: [
                                answer("card-a",
                                    2,
                                    2),
                            ],
                        })

                        expect(result.xpEarned).toBe(0)
                        expect(result.dailyCapReached).toBe(false)
                        expect(writeXpHistoryMock).not.toHaveBeenCalled()
                        expect(entityManager.update).not.toHaveBeenCalled()
                    })

                it("clamps the grant to the remaining daily headroom",
                    async () => {
                        grantedToday = "57"

                        const result = await service.complete({
                            userId: USER_ID,
                            sessionId: SESSION_ID,
                            courseId: COURSE_ID,
                            answers: [
                                answer("card-a",
                                    2,
                                    2),
                                answer("card-b",
                                    2,
                                    2),
                            ],
                        })

                        // coverage 1.0 x 2 cards x 3 = 6, but only 3 of the 60 cap is left
                        expect(result.xpEarned).toBe(3)
                        expect(result.dailyCapReached).toBe(true)
                        expect(writeXpHistoryMock).toHaveBeenCalledWith(
                            expect.objectContaining({
                                amount: 3,
                            }),
                        )
                    })

                it("writes no ledger row once the daily cap is exhausted",
                    async () => {
                        grantedToday = "60"

                        const result = await service.complete({
                            userId: USER_ID,
                            sessionId: SESSION_ID,
                            courseId: COURSE_ID,
                            answers: [
                                answer("card-a",
                                    2,
                                    2),
                            ],
                        })

                        expect(result.xpEarned).toBe(0)
                        expect(result.dailyCapReached).toBe(true)
                        expect(writeXpHistoryMock).not.toHaveBeenCalled()
                    })

                it("treats an unreadable daily sum as zero granted today",
                    async () => {
                        entityManager.createQueryBuilder().getRawOne
                            .mockResolvedValue(null)

                        const result = await service.complete({
                            userId: USER_ID,
                            sessionId: SESSION_ID,
                            courseId: COURSE_ID,
                            answers: [
                                answer("card-a",
                                    2,
                                    2),
                            ],
                        })

                        expect(result.xpEarned).toBe(3)
                    })
            })

        describe("session row bookkeeping",
            () => {
                it("snapshots coverage, weak tags and the granted XP on the row",
                    async () => {
                        entityManager.findOne.mockImplementation(
                            async (entityClass: {
                                name: string
                            }) => entityClass.name === FlashcardQuizSessionEntity.name
                                ? {
                                    id: SESSION_ID,
                                }
                                : null,
                        )

                        await service.complete({
                            userId: USER_ID,
                            sessionId: SESSION_ID,
                            courseId: COURSE_ID,
                            answers: [
                                answer("card-a",
                                    2,
                                    2),
                            ],
                        })

                        const [
                            firstEntity,
                            firstWhere,
                            firstPatch,
                        ] = entityManager.update.mock.calls[0]
                        expect(firstEntity).toBe(FlashcardQuizSessionEntity)
                        expect(firstWhere.id).toBe(SESSION_ID)
                        // replay-safe guard tolerates an abandoned row, refuses a completed one
                        expect(firstWhere.status).toBeDefined()
                        expect(firstPatch).toEqual({
                            status: "completed",
                            coverage: 1,
                            weakTags: [],
                        })
                        // the granted amount is only known after the headroom clamp
                        expect(entityManager.update.mock.calls[1]).toEqual([
                            FlashcardQuizSessionEntity,
                            {
                                id: SESSION_ID,
                            },
                            {
                                xpEarned: 3,
                            },
                        ])
                    })

                it("does not touch a session row the caller does not own",
                    async () => {
                        const result = await service.complete({
                            userId: USER_ID,
                            sessionId: "client-generated-id",
                            courseId: COURSE_ID,
                            answers: [
                                answer("card-a",
                                    2,
                                    2),
                            ],
                        })

                        // the legacy client's id matches no owned row: only the
                        // post-grant xpEarned snapshot is issued
                        expect(entityManager.update).toHaveBeenCalledTimes(1)
                        expect(entityManager.update.mock.calls[0][2]).toEqual({
                            xpEarned: 3,
                        })
                        expect(result.xpEarned).toBe(3)
                    })
            })

        describe("weak tags",
            () => {
                it("returns no weak tags for an empty session",
                    async () => {
                        const result = await service.complete({
                            userId: USER_ID,
                            sessionId: SESSION_ID,
                            courseId: COURSE_ID,
                            answers: [],
                        })

                        expect(result.weakTags).toEqual([])
                        expect(entityManager.find).not.toHaveBeenCalled()
                    })

                it("ranks tags weakest first and averages across cards",
                    async () => {
                        entityManager.find.mockResolvedValue([
                            {
                                id: "card-a",
                                tags: [
                                    "closures",
                                    "async",
                                ],
                                deck: {
                                    courseId: COURSE_ID,
                                },
                            },
                            {
                                id: "card-b",
                                tags: [
                                    "async",
                                ],
                                deck: {
                                    courseId: COURSE_ID,
                                },
                            },
                        ])

                        const result = await service.complete({
                            userId: USER_ID,
                            sessionId: SESSION_ID,
                            courseId: COURSE_ID,
                            answers: [
                                answer("card-a",
                                    2,
                                    2),
                                answer("card-b",
                                    0,
                                    2),
                            ],
                        })

                        expect(entityManager.find).toHaveBeenCalledWith(
                            FlashcardCardEntity,
                            expect.objectContaining({
                                relations: {
                                    deck: true,
                                },
                            }),
                        )
                        expect(result.weakTags.map((weak) => weak.tag)).toEqual([
                            "async",
                            "closures",
                        ])
                        // async: (1.0 from card-a + 0.0 from card-b) / 2 = 0.5
                        expect(result.weakTags[0].coverage).toBe(0.5)
                        expect(result.weakTags[1].coverage).toBe(1)
                    })

                it("skips an answer whose card row no longer exists",
                    async () => {
                        entityManager.find.mockResolvedValue([])

                        const result = await service.complete({
                            userId: USER_ID,
                            sessionId: SESSION_ID,
                            courseId: COURSE_ID,
                            answers: [
                                answer("deleted-card",
                                    1,
                                    2),
                            ],
                        })

                        expect(result.weakTags).toEqual([])
                    })

                it("keeps at most the five weakest tags",
                    async () => {
                        entityManager.find.mockResolvedValue([
                            {
                                id: "card-a",
                                tags: [
                                    "t1",
                                    "t2",
                                    "t3",
                                    "t4",
                                    "t5",
                                    "t6",
                                    "t7",
                                ],
                                deck: {
                                    courseId: COURSE_ID,
                                },
                            },
                        ])

                        const result = await service.complete({
                            userId: USER_ID,
                            sessionId: SESSION_ID,
                            courseId: COURSE_ID,
                            answers: [
                                answer("card-a",
                                    1,
                                    2),
                            ],
                        })

                        expect(result.weakTags).toHaveLength(5)
                    })

                it("attaches the lesson deep link resolved through RAG",
                    async () => {
                        entityManager.find.mockResolvedValue([
                            {
                                id: "card-a",
                                tags: [
                                    "closures",
                                ],
                                deck: {
                                    courseId: COURSE_ID,
                                },
                            },
                        ])
                        ragService.searchCourse.mockResolvedValue({
                            hits: [
                                {
                                    kind: "challenge",
                                    contentId: "not-a-lesson",
                                },
                                {
                                    kind: "code",
                                    contentId: "content-1",
                                },
                            ],
                        })
                        entityManager.findOne.mockImplementation(
                            async (entityClass: {
                                name: string
                            }) => entityClass.name === ContentEntity.name
                                ? {
                                    id: "content-1",
                                    moduleId: "module-1",
                                }
                                : null,
                        )

                        const result = await service.complete({
                            userId: USER_ID,
                            sessionId: SESSION_ID,
                            courseId: COURSE_ID,
                            answers: [
                                answer("card-a",
                                    1,
                                    2),
                            ],
                        })

                        expect(ragService.searchCourse).toHaveBeenCalledWith({
                            courseId: COURSE_ID,
                            query: "closures",
                        })
                        expect(result.weakTags[0]).toEqual({
                            tag: "closures",
                            coverage: 0.5,
                            contentId: "content-1",
                            moduleId: "module-1",
                        })
                    })

                it("omits the link when RAG surfaces no lesson hit",
                    async () => {
                        entityManager.find.mockResolvedValue([
                            {
                                id: "card-a",
                                tags: [
                                    "closures",
                                ],
                                deck: {
                                    courseId: COURSE_ID,
                                },
                            },
                        ])
                        ragService.searchCourse.mockResolvedValue({
                            hits: [
                                {
                                    kind: "flashcard",
                                    contentId: "x",
                                },
                            ],
                        })

                        const result = await service.complete({
                            userId: USER_ID,
                            sessionId: SESSION_ID,
                            courseId: COURSE_ID,
                            answers: [
                                answer("card-a",
                                    1,
                                    2),
                            ],
                        })

                        expect(result.weakTags[0]).toEqual({
                            tag: "closures",
                            coverage: 0.5,
                        })
                    })

                it("omits the link when the RAG hit points at a missing content row",
                    async () => {
                        entityManager.find.mockResolvedValue([
                            {
                                id: "card-a",
                                tags: [
                                    "closures",
                                ],
                                deck: {
                                    courseId: COURSE_ID,
                                },
                            },
                        ])
                        ragService.searchCourse.mockResolvedValue({
                            hits: [
                                {
                                    kind: "content",
                                    contentId: "stale-content",
                                },
                            ],
                        })

                        const result = await service.complete({
                            userId: USER_ID,
                            sessionId: SESSION_ID,
                            courseId: COURSE_ID,
                            answers: [
                                answer("card-a",
                                    1,
                                    2),
                            ],
                        })

                        expect(result.weakTags[0].contentId).toBeUndefined()
                    })

                it("skips the RAG lookup when the card's deck has no course",
                    async () => {
                        entityManager.find.mockResolvedValue([
                            {
                                id: "card-a",
                                tags: [
                                    "closures",
                                ],
                                deck: null,
                            },
                        ])

                        const result = await service.complete({
                            userId: USER_ID,
                            sessionId: SESSION_ID,
                            courseId: COURSE_ID,
                            answers: [
                                answer("card-a",
                                    1,
                                    2),
                            ],
                        })

                        expect(ragService.searchCourse).not.toHaveBeenCalled()
                        expect(result.weakTags[0].contentId).toBeUndefined()
                    })

                it("skips the RAG lookup for a blank tag",
                    async () => {
                        entityManager.find.mockResolvedValue([
                            {
                                id: "card-a",
                                tags: [
                                    "   ",
                                ],
                                deck: {
                                    courseId: COURSE_ID,
                                },
                            },
                        ])

                        await service.complete({
                            userId: USER_ID,
                            sessionId: SESSION_ID,
                            courseId: COURSE_ID,
                            answers: [
                                answer("card-a",
                                    1,
                                    2),
                            ],
                        })

                        expect(ragService.searchCourse).not.toHaveBeenCalled()
                    })
            })

        describe("readiness",
            () => {
                it("reports the learner as locked below the building threshold",
                    async () => {
                        statsService.getStats.mockResolvedValue({
                            retentionRate: 39,
                        })

                        const result = await service.complete({
                            userId: USER_ID,
                            sessionId: SESSION_ID,
                            courseId: COURSE_ID,
                            answers: [
                                answer("card-a",
                                    1,
                                    1),
                            ],
                        })

                        expect(statsService.getStats).toHaveBeenCalledWith({
                            userId: USER_ID,
                        })
                        expect(result.readiness).toEqual({
                            currentAvg: 39,
                            threshold: 40,
                            unlocked: false,
                        })
                    })

                it("unlocks exactly at the threshold",
                    async () => {
                        statsService.getStats.mockResolvedValue({
                            retentionRate: 40,
                        })

                        const result = await service.complete({
                            userId: USER_ID,
                            sessionId: SESSION_ID,
                            courseId: COURSE_ID,
                            answers: [
                                answer("card-a",
                                    1,
                                    1),
                            ],
                        })

                        expect(result.readiness.unlocked).toBe(true)
                    })

                it("still reports readiness on a replay that granted nothing",
                    async () => {
                        entityManager.findOne.mockImplementation(
                            async (entityClass: {
                                name: string
                            }) => entityClass.name === XpHistoryEntity.name
                                ? {
                                    id: "ledger-row",
                                }
                                : null,
                        )

                        const result = await service.complete({
                            userId: USER_ID,
                            sessionId: SESSION_ID,
                            courseId: COURSE_ID,
                            answers: [
                                answer("card-a",
                                    1,
                                    1),
                            ],
                        })

                        expect(result.xpEarned).toBe(0)
                        expect(result.readiness.currentAvg).toBe(55)
                    })
            })
    })
