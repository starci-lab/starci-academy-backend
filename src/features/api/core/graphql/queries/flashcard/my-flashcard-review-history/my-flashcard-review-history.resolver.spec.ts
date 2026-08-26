import {
    MyFlashcardReviewHistoryResolver,
} from "./my-flashcard-review-history.resolver"

describe("MyFlashcardReviewHistoryResolver",
    () => {
        it("maps review history and passes default pagination to its service",
            async () => {
                const updatedAt = new Date("2026-08-02T00:00:00.000Z")
                const list = jest.fn().mockResolvedValue({
                    totalCount: 1,
                    items: [{
                        id: "review-1",
                        updatedAt,
                        deckId: "deck-1",
                        deckTitle: "Algorithms",
                        cardCount: 5,
                        reviewedCount: 4,
                        xpEarned: 3,
                    }],
                })

                await expect(new MyFlashcardReviewHistoryResolver({
                    list,
                } as never).execute({
                    id: "user-2",
                } as never,
                "course-2",
                null,
                null)).resolves.toEqual({
                    totalCount: 1,
                    items: [{
                        id: "review-1",
                        updatedAt: updatedAt.toISOString(),
                        deckId: "deck-1",
                        deckTitle: "Algorithms",
                        cardCount: 5,
                        reviewedCount: 4,
                        xpEarned: 3,
                    }],
                })
                expect(list).toHaveBeenCalledWith({
                    userId: "user-2",
                    courseId: "course-2",
                    limit: 10,
                    offset: 0,
                })
            })
    })
