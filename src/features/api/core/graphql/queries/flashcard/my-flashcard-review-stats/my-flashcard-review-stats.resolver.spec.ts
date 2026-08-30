import {
    MyFlashcardReviewStatsResolver,
} from "./my-flashcard-review-stats.resolver"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"

describe("MyFlashcardReviewStatsResolver",
    () => {
        it("maps every computed review-stat field for the requested course",
            async () => {
                const computed = {
                    leechFocus: true,
                    weakTags: [{
                        tag: "arrays",
                    }],
                    matureRetention: 0.9,
                    youngRetention: 0.7,
                    reviewedTotal: 10,
                    courseRetention: 0.8,
                    deckRetention: [{
                        deckId: "deck-1",
                    }],
                }
                const compute = jest.fn().mockResolvedValue(computed)

                await expect(new MyFlashcardReviewStatsResolver({
                    compute,
                } as never).execute({
                    id: "user-1",
                } as never,
                Locale.Vi,
                "course-1")).resolves.toEqual(computed)
                expect(compute).toHaveBeenCalledWith({
                    userId: "user-1",
                    courseId: "course-1",
                    locale: Locale.Vi,
                })
            })
    })
