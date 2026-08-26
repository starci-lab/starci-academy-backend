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
    FlashcardDeckEntity,
} from "@modules/databases/postgresql/primary/entities/flashcard-deck.entity"
import {
    FlashcardReviewSessionEntity,
} from "@modules/databases/postgresql/primary/entities/flashcard-review-session.entity"
import {
    UserFlashcardReviewEntity,
} from "@modules/databases/postgresql/primary/entities/user-flashcard-review.entity"
import {
    FlashcardDeckNotFoundException,
} from "@modules/platform/exceptions/errors/flashcard/flashcard-deck-not-found"
import {
    asEntityManager,
    makeEntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import type {
    EntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import {
    UserService,
} from "../user/user.service"
import {
    FlashcardReviewSessionService,
} from "./flashcard-review-session.service"

/** The caller in every test. */
const USER_ID = "user-1"
/** The deck the review draw is scoped to. */
const DECK_ID = "deck-1"
/** The enrollment `resolveOrCreateTrialEnrollment` resolves to. */
const ENROLLMENT = {
    id: "enrollment-1",
}
/** The deck row the service loads to derive the owning course. */
const DECK = {
    id: DECK_ID,
    title: "SM-2 basics",
    course: {
        id: "course-1",
    },
}

describe("FlashcardReviewSessionService",
    () => {
        let testingModule: TestingModule
        let service: FlashcardReviewSessionService
        let entityManager: EntityManagerMock
        let userService: {
            resolveOrCreateTrialEnrollment: jest.Mock
            checkEnrollment: jest.Mock
        }

        /**
         * Route `findOne` per entity so a test can program the deck lookup and the
         * session lookup independently.
         *
         * @param byEntityName - Resolver per entity class name
         */
        const programFindOne = (
            byEntityName: Record<string, unknown>,
        ): void => {
            entityManager.findOne.mockImplementation(
                async (entityClass: {
                    name: string
                }) => byEntityName[entityClass.name] ?? null,
            )
        }

        beforeEach(async () => {
            entityManager = makeEntityManagerMock()
            entityManager.find.mockResolvedValue([])
            userService = {
                resolveOrCreateTrialEnrollment: jest.fn()
                    .mockResolvedValue(ENROLLMENT),
                checkEnrollment: jest.fn()
                    .mockResolvedValue(true),
            }

            testingModule = await Test.createTestingModule({
                providers: [
                    FlashcardReviewSessionService,
                    {
                        provide: getEntityManagerToken("primary"),
                        useValue: asEntityManager(entityManager),
                    },
                    {
                        provide: UserService,
                        useValue: userService,
                    },
                ],
            }).compile()

            service = testingModule.get(FlashcardReviewSessionService)
        })

        afterEach(async () => {
            await testingModule.close()
        })

        describe("start",
            () => {
                beforeEach(() => {
                    entityManager.save.mockResolvedValue({
                        id: "session-new",
                    })
                })

                it("persists the full draw and retires the prior in-flight one",
                    async () => {
                        programFindOne({
                            [FlashcardDeckEntity.name]: DECK,
                        })

                        const result = await service.start({
                            userId: USER_ID,
                            deckId: DECK_ID,
                            cardIds: [
                                "card-a",
                                "card-b",
                            ],
                        })

                        expect(result).toEqual({
                            sessionId: "session-new",
                        })
                        // the enrollment is derived from the deck's own course
                        expect(userService.resolveOrCreateTrialEnrollment)
                            .toHaveBeenCalledWith(USER_ID,
                                "course-1")
                        expect(entityManager.update).toHaveBeenCalledWith(
                            FlashcardReviewSessionEntity,
                            {
                                enrollment: {
                                    id: "enrollment-1",
                                },
                                deck: {
                                    id: DECK_ID,
                                },
                                status: "in_progress",
                            },
                            {
                                status: "abandoned",
                            },
                        )
                        expect(entityManager.save).toHaveBeenCalledWith(
                            FlashcardReviewSessionEntity,
                            {
                                enrollment: ENROLLMENT,
                                deck: {
                                    id: DECK_ID,
                                },
                                cardIds: [
                                    "card-a",
                                    "card-b",
                                ],
                                currentIndex: 0,
                                reviewedCount: 0,
                                gradedIndexes: [],
                                xpEarned: 0,
                                status: "in_progress",
                            },
                        )
                    })

                it("keeps only accessible cards for a trial review draw",
                    async () => {
                        programFindOne({
                            [FlashcardDeckEntity.name]: DECK,
                        })
                        userService.checkEnrollment.mockResolvedValueOnce(false)
                        entityManager.find.mockResolvedValueOnce([{
                            id: "card-a",
                        }])

                        await service.start({
                            userId: USER_ID,
                            deckId: DECK_ID,
                            cardIds: [
                                "card-a",
                                "card-premium",
                            ],
                        })

                        expect(entityManager.save).toHaveBeenCalledWith(
                            FlashcardReviewSessionEntity,
                            expect.objectContaining({
                                cardIds: [
                                    "card-a",
                                ],
                            }),
                        )
                    })

                it("rejects a draw against a deck that does not exist",
                    async () => {
                        programFindOne({
                        })

                        await expect(service.start({
                            userId: USER_ID,
                            deckId: DECK_ID,
                            cardIds: [
                                "card-a",
                            ],
                        })).rejects.toBeInstanceOf(FlashcardDeckNotFoundException)
                        expect(entityManager.save).not.toHaveBeenCalled()
                    })

                it("keeps only the due cards in due-only mode",
                    async () => {
                        programFindOne({
                            [FlashcardDeckEntity.name]: DECK,
                        })
                        const future = new Date(Date.now() + 60 * 60 * 1000)
                        const past = new Date(Date.now() - 60 * 60 * 1000)
                        entityManager.find.mockResolvedValue([
                            {
                                dueAt: future,
                                flashcardCard: {
                                    id: "card-not-due",
                                },
                            },
                            {
                                dueAt: past,
                                flashcardCard: {
                                    id: "card-overdue",
                                },
                            },
                            {
                                dueAt: null,
                                flashcardCard: {
                                    id: "card-unscheduled",
                                },
                            },
                        ])

                        await service.start({
                            userId: USER_ID,
                            deckId: DECK_ID,
                            mode: "due",
                            cardIds: [
                                "card-not-due",
                                "card-overdue",
                                "card-unscheduled",
                                "card-never-reviewed",
                            ],
                        })

                        expect(entityManager.find).toHaveBeenCalledWith(
                            UserFlashcardReviewEntity,
                            expect.objectContaining({
                                where: expect.objectContaining({
                                    userId: USER_ID,
                                }),
                            }),
                        )
                        const [
                            ,
                            saved,
                        ] = entityManager.save.mock.calls[0]
                        // never-reviewed, overdue and unscheduled are due; a card
                        // graded Good recently (future due_at) drops out
                        expect(saved.cardIds).toEqual([
                            "card-overdue",
                            "card-unscheduled",
                            "card-never-reviewed",
                        ])
                    })

                it("falls back to the full set when nothing is due",
                    async () => {
                        programFindOne({
                            [FlashcardDeckEntity.name]: DECK,
                        })
                        entityManager.find.mockResolvedValue([
                            {
                                dueAt: new Date(Date.now() + 60 * 60 * 1000),
                                flashcardCard: {
                                    id: "card-a",
                                },
                            },
                        ])

                        await service.start({
                            userId: USER_ID,
                            deckId: DECK_ID,
                            mode: "due",
                            cardIds: [
                                "card-a",
                            ],
                        })

                        const [
                            ,
                            saved,
                        ] = entityManager.save.mock.calls[0]
                        // an empty draw is never persisted -- defensive floor
                        expect(saved.cardIds).toEqual([
                            "card-a",
                        ])
                    })

                it("does not query review rows in full mode",
                    async () => {
                        programFindOne({
                            [FlashcardDeckEntity.name]: DECK,
                        })

                        await service.start({
                            userId: USER_ID,
                            deckId: DECK_ID,
                            mode: "full",
                            cardIds: [
                                "card-a",
                            ],
                        })

                        expect(entityManager.find).not.toHaveBeenCalled()
                    })
            })

        describe("sync",
            () => {
                it("writes the reported position for an owned in-flight session",
                    async () => {
                        programFindOne({
                            [FlashcardReviewSessionEntity.name]: {
                                id: "session-1",
                                status: "in_progress",
                            },
                        })

                        const result = await service.sync({
                            userId: USER_ID,
                            sessionId: "session-1",
                            currentIndex: 4,
                            reviewedCount: 3,
                            gradedIndexes: [
                                0,
                                1,
                                2,
                            ],
                            xpEarned: 9,
                        })

                        expect(result).toEqual({
                            success: true,
                        })
                        expect(entityManager.update).toHaveBeenCalledWith(
                            FlashcardReviewSessionEntity,
                            {
                                id: "session-1",
                            },
                            {
                                currentIndex: 4,
                                reviewedCount: 3,
                                gradedIndexes: [
                                    0,
                                    1,
                                    2,
                                ],
                                xpEarned: 9,
                            },
                        )
                    })

                it("leaves the graded-index set untouched when the caller omits it",
                    async () => {
                        programFindOne({
                            [FlashcardReviewSessionEntity.name]: {
                                id: "session-1",
                                status: "in_progress",
                            },
                        })

                        await service.sync({
                            userId: USER_ID,
                            sessionId: "session-1",
                            currentIndex: 1,
                            reviewedCount: 1,
                            xpEarned: 0,
                        })

                        expect(entityManager.update).toHaveBeenCalledWith(
                            FlashcardReviewSessionEntity,
                            {
                                id: "session-1",
                            },
                            {
                                currentIndex: 1,
                                reviewedCount: 1,
                                xpEarned: 0,
                            },
                        )
                    })

                it("no-ops for a session that is not found or not owned",
                    async () => {
                        programFindOne({
                        })

                        await expect(service.sync({
                            userId: USER_ID,
                            sessionId: "someone-elses",
                            currentIndex: 1,
                            reviewedCount: 1,
                            xpEarned: 0,
                        })).resolves.toEqual({
                            success: false,
                        })
                        expect(entityManager.update).not.toHaveBeenCalled()
                    })

                it("no-ops for a session that is no longer in progress",
                    async () => {
                        programFindOne({
                            [FlashcardReviewSessionEntity.name]: {
                                id: "session-1",
                                status: "abandoned",
                            },
                        })

                        await expect(service.sync({
                            userId: USER_ID,
                            sessionId: "session-1",
                            currentIndex: 1,
                            reviewedCount: 1,
                            xpEarned: 0,
                        })).resolves.toEqual({
                            success: false,
                        })
                        expect(entityManager.update).not.toHaveBeenCalled()
                    })
            })

        describe("complete",
            () => {
                it("flips an owned row to completed with the reported snapshot",
                    async () => {
                        programFindOne({
                            [FlashcardReviewSessionEntity.name]: {
                                id: "session-1",
                            },
                        })

                        const result = await service.complete({
                            userId: USER_ID,
                            sessionId: "session-1",
                            reviewedCount: 8,
                            xpEarned: 24,
                        })

                        expect(result).toEqual({
                            reviewedCount: 8,
                            xpEarned: 24,
                        })
                        const [
                            entity,
                            where,
                            patch,
                        ] = entityManager.update.mock.calls[0]
                        expect(entity).toBe(FlashcardReviewSessionEntity)
                        expect(where.id).toBe("session-1")
                        // replay-safe guard: an already-completed row is refused
                        expect(where.status).toBeDefined()
                        expect(patch).toEqual({
                            status: "completed",
                            reviewedCount: 8,
                            xpEarned: 24,
                        })
                    })

                it("echoes the snapshot without writing when the row is not owned",
                    async () => {
                        programFindOne({
                        })

                        const result = await service.complete({
                            userId: USER_ID,
                            sessionId: "someone-elses",
                            reviewedCount: 3,
                            xpEarned: 6,
                        })

                        expect(result).toEqual({
                            reviewedCount: 3,
                            xpEarned: 6,
                        })
                        expect(entityManager.update).not.toHaveBeenCalled()
                    })
            })

        describe("findInProgress",
            () => {
                it("returns the resumable draw for this enrollment and deck",
                    async () => {
                        const updatedAt = new Date("2026-08-19T10:00:00.000Z")
                        programFindOne({
                            [FlashcardDeckEntity.name]: DECK,
                            [FlashcardReviewSessionEntity.name]: {
                                id: "session-1",
                                status: "in_progress",
                                cardIds: [
                                    "card-a",
                                ],
                                currentIndex: 1,
                                reviewedCount: 1,
                                gradedIndexes: [
                                    0,
                                ],
                                xpEarned: 3,
                                updatedAt,
                            },
                        })

                        const found = await service.findInProgress({
                            userId: USER_ID,
                            deckId: DECK_ID,
                        })

                        expect(found).toEqual({
                            sessionId: "session-1",
                            cardIds: [
                                "card-a",
                            ],
                            currentIndex: 1,
                            reviewedCount: 1,
                            gradedIndexes: [
                                0,
                            ],
                            xpEarned: 3,
                            updatedAt,
                        })
                        const sessionCall = entityManager.findOne.mock.calls.find(
                            ([
                                entityClass,
                            ]) => entityClass === FlashcardReviewSessionEntity,
                        )
                        expect(sessionCall?.[1].where.deck).toEqual({
                            id: DECK_ID,
                        })
                        expect(sessionCall?.[1].where.status).toBe("in_progress")
                        expect(sessionCall?.[1].where.updatedAt).toBeDefined()
                    })

                it("defaults a null graded-index column to an empty list",
                    async () => {
                        programFindOne({
                            [FlashcardDeckEntity.name]: DECK,
                            [FlashcardReviewSessionEntity.name]: {
                                id: "session-1",
                                status: "in_progress",
                                cardIds: [],
                                currentIndex: 0,
                                reviewedCount: 0,
                                gradedIndexes: null,
                                xpEarned: 0,
                                updatedAt: new Date(),
                            },
                        })

                        const found = await service.findInProgress({
                            userId: USER_ID,
                            deckId: DECK_ID,
                        })

                        expect(found?.gradedIndexes).toEqual([])
                    })

                it("repairs a legacy trial session so every returned card is learnable",
                    async () => {
                        const updatedAt = new Date("2026-08-19T10:00:00.000Z")
                        programFindOne({
                            [FlashcardReviewSessionEntity.name]: {
                                id: "session-legacy",
                                status: "in_progress",
                                deckId: DECK_ID,
                                deck: {
                                    title: "SM-2 basics",
                                    course: {
                                        id: "course-1",
                                    },
                                },
                                cardIds: [
                                    "free-a",
                                    "premium-a",
                                    "free-b",
                                ],
                                currentIndex: 1,
                                reviewedCount: 1,
                                gradedIndexes: [
                                    0,
                                ],
                                xpEarned: 3,
                                updatedAt,
                            },
                        })
                        userService.checkEnrollment.mockResolvedValueOnce(false)
                        entityManager.find.mockResolvedValueOnce([{
                            id: "free-a",
                        },
                        {
                            id: "free-b",
                        }])

                        const found = await service.findById({
                            userId: USER_ID,
                            sessionId: "session-legacy",
                        })

                        expect(found).toEqual(expect.objectContaining({
                            cardIds: [
                                "free-a",
                                "free-b",
                            ],
                            currentIndex: 1,
                            reviewedCount: 1,
                            gradedIndexes: [
                                0,
                            ],
                        }))
                        expect(entityManager.update).toHaveBeenCalledWith(
                            FlashcardReviewSessionEntity,
                            {
                                id: "session-legacy",
                            },
                            expect.objectContaining({
                                cardIds: [
                                    "free-a",
                                    "free-b",
                                ],
                                currentIndex: 1,
                                status: "in_progress",
                            }),
                        )
                    })

                it("rejects a lookup against a deck that does not exist",
                    async () => {
                        programFindOne({
                        })

                        await expect(service.findInProgress({
                            userId: USER_ID,
                            deckId: DECK_ID,
                        })).rejects.toBeInstanceOf(FlashcardDeckNotFoundException)
                    })

                it("returns null when this deck has nothing resumable",
                    async () => {
                        programFindOne({
                            [FlashcardDeckEntity.name]: DECK,
                        })

                        await expect(service.findInProgress({
                            userId: USER_ID,
                            deckId: DECK_ID,
                        })).resolves.toBeNull()
                    })
            })

        describe("findById",
            () => {
                it("resolves a session by id and attaches its deck identity",
                    async () => {
                        const updatedAt = new Date("2026-08-19T10:00:00.000Z")
                        programFindOne({
                            [FlashcardReviewSessionEntity.name]: {
                                id: "session-1",
                                deckId: DECK_ID,
                                deck: {
                                    title: "SM-2 basics",
                                    course: {
                                        id: "course-1",
                                    },
                                },
                                cardIds: [
                                    "card-a",
                                ],
                                currentIndex: 1,
                                reviewedCount: 1,
                                gradedIndexes: [
                                    0,
                                ],
                                xpEarned: 3,
                                updatedAt,
                            },
                        })

                        const found = await service.findById({
                            userId: USER_ID,
                            sessionId: "session-1",
                        })

                        expect(found).toEqual({
                            sessionId: "session-1",
                            deckId: DECK_ID,
                            deckTitle: "SM-2 basics",
                            cardIds: [
                                "card-a",
                            ],
                            currentIndex: 1,
                            reviewedCount: 1,
                            gradedIndexes: [
                                0,
                            ],
                            xpEarned: 3,
                            updatedAt,
                        })
                    })

                it("defaults a null graded-index column to an empty list",
                    async () => {
                        programFindOne({
                            [FlashcardReviewSessionEntity.name]: {
                                id: "session-1",
                                deckId: DECK_ID,
                                deck: {
                                    title: "SM-2 basics",
                                    course: {
                                        id: "course-1",
                                    },
                                },
                                cardIds: [],
                                currentIndex: 0,
                                reviewedCount: 0,
                                gradedIndexes: null,
                                xpEarned: 0,
                                updatedAt: new Date(),
                            },
                        })

                        const found = await service.findById({
                            userId: USER_ID,
                            sessionId: "session-1",
                        })

                        expect(found?.gradedIndexes).toEqual([])
                    })

                it("returns null for a session the caller does not own",
                    async () => {
                        programFindOne({
                        })

                        await expect(service.findById({
                            userId: USER_ID,
                            sessionId: "someone-elses",
                        })).resolves.toBeNull()
                    })
            })
    })
