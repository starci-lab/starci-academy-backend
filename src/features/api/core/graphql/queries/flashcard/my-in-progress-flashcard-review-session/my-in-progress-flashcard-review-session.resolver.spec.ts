import {
    MyInProgressFlashcardReviewSessionResolver,
} from "./my-in-progress-flashcard-review-session.resolver"

describe("MyInProgressFlashcardReviewSessionResolver",
    () => {
        it("returns null when the deck has no active review session",
            async () => {
                const findInProgress = jest.fn().mockResolvedValue(null)
                await expect(new MyInProgressFlashcardReviewSessionResolver({
                    findInProgress,
                } as never).execute({
                    id: "user-1",
                } as never,
                "deck-1")).resolves.toBeNull()
            })

        it("maps an active review and defaults missing graded indexes",
            async () => {
                const updatedAt = new Date("2026-08-01T01:00:00.000Z")
                const findInProgress = jest.fn().mockResolvedValue({
                    sessionId: "review-1",
                    cardIds: ["card-1",
                        "card-2"],
                    currentIndex: 1,
                    reviewedCount: 1,
                    gradedIndexes: undefined,
                    xpEarned: 2,
                    updatedAt,
                })

                await expect(new MyInProgressFlashcardReviewSessionResolver({
                    findInProgress,
                } as never).execute({
                    id: "user-1",
                } as never,
                "deck-1")).resolves.toEqual({
                    sessionId: "review-1",
                    cardIds: ["card-1",
                        "card-2"],
                    currentIndex: 1,
                    reviewedCount: 1,
                    gradedIndexes: [],
                    xpEarned: 2,
                    updatedAt: updatedAt.toISOString(),
                })
            })
    })
