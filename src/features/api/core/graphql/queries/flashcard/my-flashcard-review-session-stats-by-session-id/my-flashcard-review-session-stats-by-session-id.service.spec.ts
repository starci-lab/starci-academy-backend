import {
    FlashcardCardEntity,
} from "@modules/databases/postgresql/primary/entities/flashcard-card.entity"
import {
    FlashcardDueReviewSessionEntity,
} from "@modules/databases/postgresql/primary/entities/flashcard-due-review-session.entity"
import {
    FlashcardReviewEventEntity,
} from "@modules/databases/postgresql/primary/entities/flashcard-review-event.entity"
import {
    FlashcardReviewSessionEntity,
} from "@modules/databases/postgresql/primary/entities/flashcard-review-session.entity"
import {
    UserFlashcardReviewEntity,
} from "@modules/databases/postgresql/primary/entities/user-flashcard-review.entity"
import {
    MyFlashcardReviewSessionStatsBySessionIdService,
} from "./my-flashcard-review-session-stats-by-session-id.service"

const event = (
    cardId: string,
    grade: number,
    reviewedAt: string,
    sessionId = "session-1",
): FlashcardReviewEventEntity => ({
    flashcardCardId: cardId,
    grade,
    reviewedAt: new Date(reviewedAt),
    sessionId,
} as unknown as FlashcardReviewEventEntity)

const session = (
    id: string,
    cardIds: Array<string>,
    reviewedCount: number,
    status: "in_progress" | "completed" | "abandoned" = "completed",
): Record<string, unknown> => ({
    id,
    cardIds,
    reviewedCount,
    status,
})

describe("MyFlashcardReviewSessionStatsBySessionIdService",
    () => {
        it("returns null when neither owner-scoped session table contains the id",
            async () => {
                const entityManager = {
                    findOne: jest.fn().mockResolvedValue(null),
                    find: jest.fn(),
                }
                const service = new MyFlashcardReviewSessionStatsBySessionIdService(entityManager as never)

                await expect(service.find({
                    userId: "user-1",
                    sessionId: "missing",
                })).resolves.toBeNull()
                expect(entityManager.findOne).toHaveBeenNthCalledWith(1,
                    FlashcardReviewSessionEntity,
                    expect.objectContaining({
                        where: expect.objectContaining({
                            id: "missing" 
                        }),
                    }))
                expect(entityManager.findOne).toHaveBeenNthCalledWith(2,
                    FlashcardDueReviewSessionEntity,
                    expect.objectContaining({
                        where: expect.objectContaining({
                            id: "missing" 
                        }),
                    }))
                expect(entityManager.find).not.toHaveBeenCalled()
            })

        it("aggregates grades, duration, first-review XP, next due date, and weak tags",
            async () => {
                const reviewed = [
                    event("card-a",
                        0,
                        "2026-01-01T00:00:00.000Z"),
                    event("card-b",
                        1,
                        "2026-01-01T00:00:04.000Z"),
                    event("card-a",
                        2,
                        "2026-01-01T00:00:10.000Z"),
                    event("card-c",
                        3,
                        "2026-01-01T00:00:20.000Z"),
                    event("card-c",
                        9,
                        "2026-01-01T00:00:25.000Z"),
                ]
                const historical = [
                    event("card-a",
                        2,
                        "2025-12-01T00:00:00.000Z",
                        "session-0"),
                    event("card-b",
                        2,
                        "2025-12-02T00:00:00.000Z",
                        "session-0"),
                    reviewed[0],
                    reviewed[1],
                    reviewed[2],
                    reviewed[3],
                    reviewed[4],
                ]
                const dueAt = new Date("2026-01-02T00:00:00.000Z")
                const entityManager = {
                    findOne: jest.fn((entity: unknown) => {
                        if (entity === FlashcardReviewSessionEntity) {
                            return Promise.resolve(session("session-1",
                                ["card-a",
                                    "card-b",
                                    "card-c"],
                                99))
                        }
                        if (entity === UserFlashcardReviewEntity) {
                            return Promise.resolve({
                                dueAt 
                            })
                        }
                        return Promise.resolve(null)
                    }),
                    find: jest.fn((entity: unknown, options: { where: Record<string, unknown> }) => {
                        if (entity === FlashcardReviewEventEntity) {
                            return Promise.resolve(options.where.flashcardCardId ? historical : reviewed)
                        }
                        if (entity === FlashcardCardEntity) {
                            return Promise.resolve([
                                {
                                    id: "card-a", tags: ["sql",
                                        "indexes"] 
                                },
                                {
                                    id: "card-b", tags: ["sql",
                                        "queues"] 
                                },
                                {
                                    id: "card-c", tags: null 
                                },
                            ])
                        }
                        return Promise.resolve([])
                    }),
                }
                const service = new MyFlashcardReviewSessionStatsBySessionIdService(entityManager as never)

                await expect(service.find({
                    userId: "user-1",
                    sessionId: "session-1",
                })).resolves.toEqual({
                    sessionId: "session-1",
                    status: "completed",
                    reviewedCount: 5,
                    gradeCounts: {
                        again: 1,
                        hard: 1,
                        good: 1,
                        easy: 1,
                    },
                    durationSeconds: 25,
                    xpEarned: 2,
                    nextDueAt: dueAt,
                    weakTags: [
                        {
                            tag: "sql", forgotCount: 1 
                        },
                        {
                            tag: "indexes", forgotCount: 1 
                        },
                    ],
                })
                expect(entityManager.findOne).toHaveBeenCalledWith(
                    UserFlashcardReviewEntity,
                    expect.objectContaining({
                        where: expect.objectContaining({
                            userId: "user-1",
                        }),
                    }),
                )
            })

        it("resolves a due-review session and degrades to its snapshot when no events exist",
            async () => {
                const dueSession = session("due-1",
                    [],
                    7,
                    "abandoned")
                const entityManager = {
                    findOne: jest.fn((entity: unknown) => entity === FlashcardDueReviewSessionEntity
                        ? Promise.resolve(dueSession)
                        : Promise.resolve(null)),
                    find: jest.fn().mockResolvedValue([]),
                }
                const service = new MyFlashcardReviewSessionStatsBySessionIdService(entityManager as never)

                await expect(service.find({
                    userId: "user-1",
                    sessionId: "due-1",
                })).resolves.toEqual({
                    sessionId: "due-1",
                    status: "abandoned",
                    reviewedCount: 7,
                    gradeCounts: {
                        again: 0,
                        hard: 0,
                        good: 0,
                        easy: 0,
                    },
                    durationSeconds: null,
                    xpEarned: 0,
                    nextDueAt: null,
                    weakTags: [],
                })
                expect(entityManager.findOne).toHaveBeenCalledTimes(2)
            })

        it("limits weak tags to five and treats missing card tags as empty",
            async () => {
                const events = Array.from({
                    length: 6 
                },
                (_unused, index) => event(
                    `card-${index}`,
                    0,
                    `2026-01-01T00:00:0${index}.000Z`,
                ))
                const cards = events.map((review) => ({
                    id: review.flashcardCardId,
                    tags: [`tag-${review.flashcardCardId}`,
                        "shared"],
                }))
                const entityManager = {
                    findOne: jest.fn((entity: unknown) => entity === FlashcardReviewSessionEntity
                        ? Promise.resolve(session("session-1",
                            [],
                            0))
                        : Promise.resolve(null)),
                    find: jest.fn((entity: unknown, options: { where: Record<string, unknown> }) => {
                        if (entity === FlashcardReviewEventEntity) {
                            return Promise.resolve(options.where.flashcardCardId ? events : events)
                        }
                        if (entity === FlashcardCardEntity) {
                            return Promise.resolve(cards)
                        }
                        return Promise.resolve([])
                    }),
                }
                const service = new MyFlashcardReviewSessionStatsBySessionIdService(entityManager as never)

                const result = await service.find({
                    userId: "user-1",
                    sessionId: "session-1",
                })

                expect(result?.weakTags).toHaveLength(5)
                expect(result?.weakTags.find((tag) => tag.tag === "shared")?.forgotCount).toBe(6)
                expect(result?.weakTags.filter((tag) => tag.tag !== "shared").every((tag) => tag.forgotCount === 1)).toBe(true)
            })
    })
