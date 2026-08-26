import {
    MyInProgressFlashcardDueReviewSessionResolver,
} from "./my-in-progress-flashcard-due-review-session.resolver"

describe("MyInProgressFlashcardDueReviewSessionResolver",
    () => {
        it("returns null when no due-review batch can be resumed",
            async () => {
                const findInProgress = jest.fn().mockResolvedValue(null)
                await expect(new MyInProgressFlashcardDueReviewSessionResolver({
                    findInProgress,
                } as never).execute({
                    id: "user-1",
                } as never,
                "course-1")).resolves.toBeNull()
            })

        it("maps an active batch and defaults absent graded indexes",
            async () => {
                const updatedAt = new Date("2026-08-02T00:00:00.000Z")
                const findInProgress = jest.fn().mockResolvedValue({
                    sessionId: "due-1",
                    cardIds: ["card-1"],
                    currentIndex: 0,
                    reviewedCount: 0,
                    gradedIndexes: undefined,
                    xpEarned: 1,
                    updatedAt,
                })

                await expect(new MyInProgressFlashcardDueReviewSessionResolver({
                    findInProgress,
                } as never).execute({
                    id: "user-1",
                } as never,
                "course-1")).resolves.toEqual({
                    sessionId: "due-1",
                    cardIds: ["card-1"],
                    currentIndex: 0,
                    reviewedCount: 0,
                    gradedIndexes: [],
                    xpEarned: 1,
                    updatedAt: updatedAt.toISOString(),
                })
            })
    })
