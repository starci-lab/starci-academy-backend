import {
    MyFlashcardStatsResolver,
} from "./my-flashcard-stats.resolver"

describe("MyFlashcardStatsResolver",
    () => {
        it("reads stats for the authenticated viewer",
            async () => {
                const getStats = jest.fn().mockResolvedValue({
                    reviewStreak: 4,
                    retentionRate: 0.8,
                    totalReviewed: 12,
                })
                const result = await new MyFlashcardStatsResolver({
                    getStats,
                } as never).execute({
                    id: "user-1",
                } as never)

                expect(result).toEqual(expect.objectContaining({
                    reviewStreak: 4,
                    totalReviewed: 12,
                }))
                expect(getStats).toHaveBeenCalledWith({
                    userId: "user-1",
                })
            })
    })
