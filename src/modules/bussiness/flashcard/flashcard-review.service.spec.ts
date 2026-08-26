import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    FlashcardReviewService,
    NEW_CARD_STATE,
} from "./flashcard-review.service"
import {
    FlashcardCardEntity,
} from "@modules/databases/postgresql/primary/entities/flashcard-card.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    FlashcardDeckResolverService,
} from "@modules/databases/postgresql/primary/resolvers/flashcard-deck-resolver.service"
import {
    FlashcardCardNotFoundException,
} from "@modules/platform/exceptions/errors/flashcard/flashcard-card-not-found"
import {
    makeEntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import type {
    EntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import {
    UserService,
} from "../user/user.service"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

describe("FlashcardReviewService",
    () => {
        let module: TestingModule
        let service: FlashcardReviewService
        let entityManager: EntityManagerMock
        let flashcardDeckResolver: jest.Mocked<Pick<FlashcardDeckResolverService, "transform">>
        let userService: jest.Mocked<
            Pick<UserService, "checkEnrollment" | "resolveOrCreateTrialEnrollment">
        >

        const userId = "user-1"
        const cardId = "card-1"
        const courseId = "course-1"

        beforeEach(async () => {
            entityManager = makeEntityManagerMock()

            flashcardDeckResolver = {
                // localization is exercised in the resolver's own spec; here a
                // no-op transform is enough to satisfy the constructor
                transform: jest.fn(),
            }

            userService = {
                checkEnrollment: jest.fn().mockResolvedValue(false),
                resolveOrCreateTrialEnrollment: jest.fn(),
            }

            module = await Test.createTestingModule({
                providers: [
                    FlashcardReviewService,
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                    {
                        provide: FlashcardDeckResolverService,
                        useValue: flashcardDeckResolver,
                    },
                    {
                        provide: UserService,
                        useValue: userService,
                    },
                ],
            }).compile()

            service = module.get<FlashcardReviewService>(FlashcardReviewService)
        })

        afterEach(async () => {
            await module.close()
        })

        describe("previewIntervals — pure SM-2 math",
            () => {
                it("schedules every successful grade to a 1-day interval on a brand-new card (repetition 1 rule)",
                    () => {
                        // NEW_CARD_STATE: prevEase 2.5, prevInterval 0, prevRepetitions 0 --
                        // repetitions becomes 1 on ANY successful grade, and rep===1 always
                        // schedules 1 day regardless of which grade got there
                        const result = service.previewIntervals(NEW_CARD_STATE)

                        expect(result).toEqual({
                            again: 1,
                            hard: 1,
                            good: 1,
                            easy: 1,
                        })
                    })

                it("differentiates the interval by grade once ease has diverged (repetition 3+)",
                    () => {
                        // a card on its 3rd successful review: ease=2.5, interval=6, reps=2
                        const prior = {
                            prevEase: 2.5,
                            prevInterval: 6,
                            prevRepetitions: 2,
                        }

                        const result = service.previewIntervals(prior)

                        // again always resets to 1 regardless of prior state
                        expect(result.again).toBe(1)
                        // hard: delta = 0.1 - 2*(0.08+2*0.02) = -0.14 -> ease 2.36 -> round(6*2.36) = 14
                        expect(result.hard).toBe(14)
                        // good: delta = 0.1 - 1*(0.08+1*0.02) = 0 -> ease unchanged 2.5 -> round(6*2.5) = 15
                        expect(result.good).toBe(15)
                        // easy: delta = 0.1 - 0 = 0.1 -> ease 2.6 -> round(6*2.6) = 16
                        expect(result.easy).toBe(16)
                    })

                it("graduates a card from the fixed 1-day slot to the fixed 6-day slot at repetition 2",
                    () => {
                        // 1st successful review already landed: reps=1, interval=1
                        const prior = {
                            prevEase: 2.5,
                            prevInterval: 1,
                            prevRepetitions: 1,
                        }

                        const result = service.previewIntervals(prior)

                        // rep becomes 2 on any successful grade -> fixed 6-day slot,
                        // independent of the ease the grade itself produces
                        expect(result.hard).toBe(6)
                        expect(result.good).toBe(6)
                        expect(result.easy).toBe(6)
                    })

                it("clamps the ease at EASE_FLOOR (1.3) instead of letting it go negative",
                    () => {
                        // already near the floor from a run of Hard grades
                        const prior = {
                            prevEase: 1.35,
                            prevInterval: 10,
                            prevRepetitions: 5,
                        }

                        const result = service.previewIntervals(prior)

                        // unclamped would be 1.35 - 0.14 = 1.21 -> clamped to 1.3 ->
                        // round(10 * 1.3) = 13, not round(10 * 1.21) = 12
                        expect(result.hard).toBe(13)
                    })
            })

        describe("review — SM-2 scheduling persisted",
            () => {
                it("persists a fresh card's first successful grade at ease 2.5 / 1 day / rep 1 (no existing row)",
                    async () => {
                        entityManager.findOne
                            // card exists, no course (global deck)
                            .mockResolvedValueOnce({
                                id: cardId,
                                deck: null,
                            } as unknown as FlashcardCardEntity)
                            // no prior review row
                            .mockResolvedValueOnce(null)

                        await service.review({
                            userId,
                            cardId,
                            grade: 2,
                        })

                        expect(entityManager.create).toHaveBeenCalledWith(
                            expect.anything(),
                            expect.objectContaining({
                                ease: 2.5,
                                intervalDays: 1,
                                repetitions: 1,
                            }),
                        )
                    })

                it("resets repetitions to 0 and leaves ease UNTOUCHED on Again (grade 0), even with review history",
                    async () => {
                        entityManager.findOne
                            .mockResolvedValueOnce({
                                id: cardId,
                                deck: null,
                            } as unknown as FlashcardCardEntity)
                            .mockResolvedValueOnce({
                                id: "review-1",
                                ease: 2.1,
                                intervalDays: 15,
                                repetitions: 4,
                                enrollmentId: "enr-1",
                            })

                        await service.review({
                            userId,
                            cardId,
                            grade: 0,
                        })

                        expect(entityManager.update).toHaveBeenCalledWith(
                            expect.anything(),
                            {
                                id: "review-1",
                            },
                            expect.objectContaining({
                                ease: 2.1,
                                intervalDays: 1,
                                repetitions: 0,
                            }),
                        )
                    })

                it("moves an existing rep-1 card to the fixed 6-day interval at repetition 2",
                    async () => {
                        entityManager.findOne
                            .mockResolvedValueOnce({
                                id: cardId,
                                deck: null,
                            } as unknown as FlashcardCardEntity)
                            .mockResolvedValueOnce({
                                id: "review-1",
                                ease: 2.5,
                                intervalDays: 1,
                                repetitions: 1,
                                enrollmentId: "enr-1",
                            })

                        await service.review({
                            userId,
                            cardId,
                            grade: 2,
                        })

                        expect(entityManager.update).toHaveBeenCalledWith(
                            expect.anything(),
                            {
                                id: "review-1",
                            },
                            expect.objectContaining({
                                ease: 2.5,
                                intervalDays: 6,
                                repetitions: 2,
                            }),
                        )
                    })

                it("multiplies interval by ease from repetition 3 onward (round(prevInterval * ease))",
                    async () => {
                        entityManager.findOne
                            .mockResolvedValueOnce({
                                id: cardId,
                                deck: null,
                            } as unknown as FlashcardCardEntity)
                            .mockResolvedValueOnce({
                                id: "review-1",
                                ease: 2.5,
                                intervalDays: 6,
                                repetitions: 2,
                                enrollmentId: "enr-1",
                            })

                        await service.review({
                            userId,
                            cardId,
                            grade: 2,
                        })

                        expect(entityManager.update).toHaveBeenCalledWith(
                            expect.anything(),
                            {
                                id: "review-1",
                            },
                            expect.objectContaining({
                                // round(6 * 2.5) = 15
                                intervalDays: 15,
                                repetitions: 3,
                            }),
                        )
                    })

                it("raises ease on Easy and lowers it on Hard from the same prior state",
                    async () => {
                        const priorReview = {
                            id: "review-1",
                            ease: 2.5,
                            intervalDays: 6,
                            repetitions: 2,
                            enrollmentId: "enr-1",
                        }

                        entityManager.findOne
                            .mockResolvedValueOnce({
                                id: cardId,
                                deck: null,
                            } as unknown as FlashcardCardEntity)
                            .mockResolvedValueOnce(priorReview)
                        await service.review({
                            userId,
                            cardId,
                            grade: 3,
                        })
                        expect(entityManager.update).toHaveBeenCalledWith(
                            expect.anything(),
                            {
                                id: "review-1",
                            },
                            expect.objectContaining({
                                ease: 2.6,
                            }),
                        )

                        entityManager.findOne
                            .mockResolvedValueOnce({
                                id: cardId,
                                deck: null,
                            } as unknown as FlashcardCardEntity)
                            .mockResolvedValueOnce(priorReview)
                        await service.review({
                            userId,
                            cardId,
                            grade: 1,
                        })
                        expect(entityManager.update).toHaveBeenLastCalledWith(
                            expect.anything(),
                            {
                                id: "review-1",
                            },
                            expect.objectContaining({
                                ease: 2.36,
                            }),
                        )
                    })

                it("clamps ease at EASE_FLOOR (1.3) on a persisted grade, not just in preview",
                    async () => {
                        entityManager.findOne
                            .mockResolvedValueOnce({
                                id: cardId,
                                deck: null,
                            } as unknown as FlashcardCardEntity)
                            .mockResolvedValueOnce({
                                id: "review-1",
                                ease: 1.35,
                                intervalDays: 10,
                                repetitions: 5,
                                enrollmentId: "enr-1",
                            })

                        await service.review({
                            userId,
                            cardId,
                            grade: 1,
                        })

                        expect(entityManager.update).toHaveBeenCalledWith(
                            expect.anything(),
                            {
                                id: "review-1",
                            },
                            expect.objectContaining({
                                ease: 1.3,
                            }),
                        )
                    })

                it("sets dueAt to now + the computed interval in days",
                    async () => {
                        jest.useFakeTimers({
                            now: new Date("2026-01-01T00:00:00.000Z"),
                        })
                        try {
                            entityManager.findOne
                                .mockResolvedValueOnce({
                                    id: cardId,
                                    deck: null,
                                } as unknown as FlashcardCardEntity)
                                .mockResolvedValueOnce({
                                    id: "review-1",
                                    ease: 2.5,
                                    intervalDays: 1,
                                    repetitions: 1,
                                    enrollmentId: "enr-1",
                                })

                            const result = await service.review({
                                userId,
                                cardId,
                                grade: 2,
                            })

                            // rep 1 -> 2 at grade Good -> fixed 6-day interval
                            expect(result.dueAt).toEqual(
                                new Date("2026-01-07T00:00:00.000Z"),
                            )
                        } finally {
                            jest.useRealTimers()
                        }
                    })

                it("throws FlashcardCardNotFoundException when the card does not exist",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce(null)

                        await expect(
                            service.review({
                                userId,
                                cardId,
                                grade: 2,
                            }),
                        ).rejects.toBeInstanceOf(FlashcardCardNotFoundException)
                    })
            })

        describe("review — XP grant (first review only)",
            () => {
                it("grants FLASHCARD_FIRST_REVIEW_XP on the first-ever review of a card (no existing row)",
                    async () => {
                        entityManager.findOne
                            .mockResolvedValueOnce({
                                id: cardId,
                                deck: null,
                            } as unknown as FlashcardCardEntity)
                            .mockResolvedValueOnce(null)

                        const result = await service.review({
                            userId,
                            cardId,
                            grade: 2,
                        })

                        expect(result.xpEarned).toBe(2)
                        // writeXpHistory's ledger write, through the same (mocked) manager
                        expect(entityManager.save).toHaveBeenCalledWith(
                            expect.anything(),
                            expect.objectContaining({
                                amount: 2,
                            }),
                        )
                    })

                it("grants ZERO XP on a repeat review of an already-reviewed card",
                    async () => {
                        entityManager.findOne
                            .mockResolvedValueOnce({
                                id: cardId,
                                deck: null,
                            } as unknown as FlashcardCardEntity)
                            .mockResolvedValueOnce({
                                id: "review-1",
                                ease: 2.5,
                                intervalDays: 1,
                                repetitions: 1,
                                enrollmentId: "enr-1",
                            })

                        const result = await service.review({
                            userId,
                            cardId,
                            grade: 2,
                        })

                        expect(result.xpEarned).toBe(0)
                        // no XpHistoryEntity row and no coin increment on a repeat grade
                        expect(entityManager.increment).not.toHaveBeenCalled()
                    })
            })

        describe("review — enrollment anchoring",
            () => {
                it("resolves/creates the trial enrollment for the card's course and attaches it to a new row",
                    async () => {
                        userService.resolveOrCreateTrialEnrollment.mockResolvedValueOnce({
                            id: "enr-new",
                        } as never)
                        entityManager.findOne
                            .mockResolvedValueOnce({
                                id: cardId,
                                deck: {
                                    courseId,
                                },
                            } as unknown as FlashcardCardEntity)
                            .mockResolvedValueOnce(null)

                        await service.review({
                            userId,
                            cardId,
                            grade: 2,
                        })

                        expect(userService.resolveOrCreateTrialEnrollment).toHaveBeenCalledWith(
                            userId,
                            courseId,
                        )
                        expect(entityManager.create).toHaveBeenCalledWith(
                            expect.anything(),
                            expect.objectContaining({
                                enrollment: {
                                    id: "enr-new",
                                },
                            }),
                        )
                    })

                it("skips enrollment resolution entirely for a global (course-less) deck",
                    async () => {
                        entityManager.findOne
                            .mockResolvedValueOnce({
                                id: cardId,
                                deck: null,
                            } as unknown as FlashcardCardEntity)
                            .mockResolvedValueOnce(null)

                        await service.review({
                            userId,
                            cardId,
                            grade: 2,
                        })

                        expect(userService.resolveOrCreateTrialEnrollment).not.toHaveBeenCalled()
                        const createArgs = entityManager.create.mock.calls[0][1]
                        expect(createArgs).not.toHaveProperty("enrollment")
                    })

                it("backfills enrollment onto a pre-re-key existing row that has none yet",
                    async () => {
                        userService.resolveOrCreateTrialEnrollment.mockResolvedValueOnce({
                            id: "enr-backfill",
                        } as never)
                        entityManager.findOne
                            .mockResolvedValueOnce({
                                id: cardId,
                                deck: {
                                    courseId,
                                },
                            } as unknown as FlashcardCardEntity)
                            .mockResolvedValueOnce({
                                id: "review-1",
                                ease: 2.5,
                                intervalDays: 1,
                                repetitions: 1,
                                enrollmentId: null,
                            })

                        await service.review({
                            userId,
                            cardId,
                            grade: 2,
                        })

                        expect(entityManager.update).toHaveBeenCalledWith(
                            expect.anything(),
                            {
                                id: "review-1",
                            },
                            expect.objectContaining({
                                enrollment: {
                                    id: "enr-backfill",
                                },
                            }),
                        )
                    })

                it("does NOT re-set enrollment on an existing row that already has one",
                    async () => {
                        userService.resolveOrCreateTrialEnrollment.mockResolvedValueOnce({
                            id: "enr-existing",
                        } as never)
                        entityManager.findOne
                            .mockResolvedValueOnce({
                                id: cardId,
                                deck: {
                                    courseId,
                                },
                            } as unknown as FlashcardCardEntity)
                            .mockResolvedValueOnce({
                                id: "review-1",
                                ease: 2.5,
                                intervalDays: 1,
                                repetitions: 1,
                                enrollmentId: "enr-existing",
                            })

                        await service.review({
                            userId,
                            cardId,
                            grade: 2,
                        })

                        const updateArgs = entityManager.update.mock.calls[0][2]
                        expect(updateArgs).not.toHaveProperty("enrollment")
                    })
            })

        describe("listDue — DAILY_NEW_LIMIT cap (the \"449\" regression)",
            () => {
                /**
                 * Builds a stand-in for the query builder chain `listDue` drives --
                 * `.innerJoin/.leftJoin/.andWhere/.select/.addSelect/.orderBy/
                 * .addOrderBy/.limit` all return the SAME builder so the fluent
                 * chain works; `getCount`/`getRawMany` are the terminals the test
                 * programs per call, in the exact order the service issues them.
                 */
                const makeQueryBuilderStub = () => {
                    const qb: Record<string, jest.Mock> = {
                    }
                    for (const chainMethod of [
                        "innerJoin",
                        "leftJoin",
                        "andWhere",
                        "select",
                        "addSelect",
                        "orderBy",
                        "addOrderBy",
                        "limit",
                    ]) {
                        qb[chainMethod] = jest.fn(() => qb)
                    }
                    qb.getCount = jest.fn()
                    qb.getRawMany = jest.fn()
                    return qb
                }

                it("caps newCount/dueCount at DAILY_NEW_LIMIT even when the never-reviewed backlog is far larger",
                    async () => {
                        const qb = makeQueryBuilderStub()
                        entityManager.createQueryBuilder = jest.fn(() => qb) as never

                        // dueReviewCount (overdue) = 0, newTotalCount = 449 -- the exact
                        // shape of the reported "449" bug: a huge never-reviewed backlog
                        qb.getCount
                            .mockResolvedValueOnce(0)
                            .mockResolvedValueOnce(449)
                        // no overdue rows on this page
                        qb.getRawMany.mockResolvedValueOnce([])
                        // the capped new batch: only DAILY_NEW_LIMIT (20) rows come back
                        const newRows = Array.from({
                            length: 20,
                        },
                        (_unused, index) => ({
                            card_id: `card-${index}`,
                            review_ease: null,
                            review_interval_days: null,
                            review_repetitions: null,
                        }))
                        qb.getRawMany.mockResolvedValueOnce(newRows)

                        entityManager.find.mockResolvedValueOnce(
                            newRows.map((row) => ({
                                id: row.card_id,
                                isPremium: false,
                                question: "Q",
                                answer: "A",
                                level: null,
                                tags: [],
                                deck: null,
                            })),
                        )

                        const result = await service.listDue({
                            userId,
                            limit: 50,
                            locale: Locale.En,
                        })

                        // the headline total still reports the real backlog size...
                        expect(result.newTotalCount).toBe(449)
                        // ...but what's actually offered today is capped
                        expect(result.newCount).toBe(20)
                        expect(result.dueReviewCount).toBe(0)
                        // dueCount (the "due today" headline) must reflect the CAP,
                        // not the full backlog -- this is the regression the cap fixes
                        expect(result.dueCount).toBe(20)
                        expect(result.cards).toHaveLength(20)
                    })
            })

        describe("listDue — premium content gate",
            () => {
                const makeQueryBuilderStub = () => {
                    const qb: Record<string, jest.Mock> = {
                    }
                    for (const chainMethod of [
                        "innerJoin",
                        "leftJoin",
                        "andWhere",
                        "select",
                        "addSelect",
                        "orderBy",
                        "addOrderBy",
                        "limit",
                    ]) {
                        qb[chainMethod] = jest.fn(() => qb)
                    }
                    qb.getCount = jest.fn()
                    qb.getRawMany = jest.fn()
                    return qb
                }

                const programOneDueCard = (qb: Record<string, jest.Mock>) => {
                    qb.getCount
                        .mockResolvedValueOnce(0)
                        .mockResolvedValueOnce(1)
                    qb.getRawMany
                        .mockResolvedValueOnce([])
                        .mockResolvedValueOnce([
                            {
                                card_id: cardId,
                                review_ease: null,
                                review_interval_days: null,
                                review_repetitions: null,
                            },
                        ])
                }

                it("withholds a premium card's answer for a viewer NOT enrolled in the owning course",
                    async () => {
                        const qb = makeQueryBuilderStub()
                        entityManager.createQueryBuilder = jest.fn(() => qb) as never
                        programOneDueCard(qb)
                        entityManager.find.mockResolvedValueOnce([
                            {
                                id: cardId,
                                isPremium: true,
                                question: "Q",
                                answer: "SECRET",
                                level: null,
                                tags: [],
                                deck: {
                                    id: "deck-1",
                                    courseId,
                                    translations: [],
                                },
                            },
                        ])
                        userService.checkEnrollment.mockResolvedValueOnce(false)

                        const result = await service.listDue({
                            userId,
                            limit: 50,
                            locale: Locale.En,
                        })

                        expect(userService.checkEnrollment).toHaveBeenCalledWith(userId,
                            courseId)
                        expect(result.cards[0].back).toBe("")
                        // the prompt itself still shows -- only the answer is withheld
                        expect(result.cards[0].front).toBe("Q")
                    })

                it("reveals a premium card's answer for a viewer enrolled in the owning course",
                    async () => {
                        const qb = makeQueryBuilderStub()
                        entityManager.createQueryBuilder = jest.fn(() => qb) as never
                        programOneDueCard(qb)
                        entityManager.find.mockResolvedValueOnce([
                            {
                                id: cardId,
                                isPremium: true,
                                question: "Q",
                                answer: "SECRET",
                                level: null,
                                tags: [],
                                deck: {
                                    id: "deck-1",
                                    courseId,
                                    translations: [],
                                },
                            },
                        ])
                        userService.checkEnrollment.mockResolvedValueOnce(true)

                        const result = await service.listDue({
                            userId,
                            limit: 50,
                            locale: Locale.En,
                        })

                        expect(result.cards[0].back).toBe("SECRET")
                    })

                it("never gates a FREE card behind enrollment (checkEnrollment is not even called)",
                    async () => {
                        const qb = makeQueryBuilderStub()
                        entityManager.createQueryBuilder = jest.fn(() => qb) as never
                        programOneDueCard(qb)
                        entityManager.find.mockResolvedValueOnce([
                            {
                                id: cardId,
                                isPremium: false,
                                question: "Q",
                                answer: "FREE ANSWER",
                                level: null,
                                tags: [],
                                deck: {
                                    id: "deck-1",
                                    courseId,
                                    translations: [],
                                },
                            },
                        ])

                        const result = await service.listDue({
                            userId,
                            limit: 50,
                            locale: Locale.En,
                        })

                        expect(userService.checkEnrollment).not.toHaveBeenCalled()
                        expect(result.cards[0].back).toBe("FREE ANSWER")
                    })
                it("scopes the due query to a course and returns counts when no cards are due",
                    async () => {
                        const qb = makeQueryBuilderStub()
                        entityManager.createQueryBuilder = jest.fn(() => qb) as never
                        qb.getCount
                            .mockResolvedValueOnce(0)
                            .mockResolvedValueOnce(0)
                        qb.getRawMany.mockResolvedValueOnce([])
                        entityManager.findOne.mockResolvedValueOnce(null)

                        await expect(service.listDue({
                            userId,
                            courseId,
                            limit: 10,
                            locale: Locale.En,
                        })).resolves.toEqual({
                            dueCount: 0,
                            dueReviewCount: 0,
                            newCount: 0,
                            newTotalCount: 0,
                            cards: [],
                        })
                        expect(qb.andWhere).toHaveBeenCalledWith("deck.course_id = :courseId",
                            {
                                courseId,
                            })
                        expect(entityManager.findOne).toHaveBeenCalled()
                    })
            })

        describe("listByIds — premium content gate (id-based rehydrate)",
            () => {
                it("withholds a premium card's answer for a viewer not entitled to its course, even off the due path",
                    async () => {
                        entityManager.find
                            // review rows: none for this user
                            .mockResolvedValueOnce([])
                            // full card graph
                            .mockResolvedValueOnce([
                                {
                                    id: cardId,
                                    isPremium: true,
                                    question: "Q",
                                    answer: "SECRET",
                                    level: null,
                                    tags: [],
                                    deck: {
                                        id: "deck-1",
                                        courseId,
                                        translations: [],
                                    },
                                },
                            ])
                        userService.checkEnrollment.mockResolvedValueOnce(false)

                        const result = await service.listByIds({
                            userId,
                            cardIds: [
                                cardId,
                            ],
                            locale: Locale.En,
                        })

                        expect(result).toHaveLength(1)
                        expect(result[0].back).toBe("")
                    })

                it("returns an empty array without touching the database when no ids are requested",
                    async () => {
                        const result = await service.listByIds({
                            userId,
                            cardIds: [],
                            locale: Locale.En,
                        })

                        expect(result).toEqual([])
                        expect(entityManager.find).not.toHaveBeenCalled()
                    })
            })
    })
