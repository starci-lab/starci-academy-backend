import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    MyFlashcardReviewStatsService,
} from "./my-flashcard-review-stats.service"

describe("MyFlashcardReviewStatsService",
    () => {
        it("localizes projected deck and leech snapshots at read time",
            async () => {
                const query = jest.fn()
                    .mockResolvedValueOnce([{
                        id: "00000000-0000-4000-8000-000000000001", value: "Nền tảng Backend", // vn-ok: localized fixture verifies vi read-time resolution.
                    }])
                    .mockResolvedValueOnce([{
                        id: "00000000-0000-4000-8000-000000000002", value: "Dependency injection là gì?", // vn-ok: localized fixture verifies vi read-time resolution.
                    }])
                const service = new MyFlashcardReviewStatsService(
                    {
                        resolveOrCreateTrialEnrollment: jest.fn().mockResolvedValue({
                            id: "enrollment-1"
                        })
                    } as never,
                    {
                        getStats: jest.fn().mockResolvedValue({
                            leechFocus: [{
                                cardId: "00000000-0000-4000-8000-000000000002", question: "What is dependency injection?", deckId: "00000000-0000-4000-8000-000000000001", deckTitle: "Backend Foundations", lapseCount: 2, reason: "lapsed"
                            }],
                            weakTags: [], matureRetention: 0, youngRetention: 0, reviewedTotal: 1, courseRetention: 100,
                            deckRetention: [{
                                deckId: "00000000-0000-4000-8000-000000000001", deckTitle: "Backend Foundations", retention: 100, reviewCount: 1
                            }],
                        })
                    } as never,
                    {
                        query
                    } as never,
                )

                const result = await service.compute({
                    userId: "user-1", courseId: "course-1", locale: Locale.Vi
                })

                expect(result.deckRetention[0]?.deckTitle).toBe("Nền tảng Backend") // vn-ok: asserts localized vi output.
                expect(result.leechFocus[0]).toMatchObject({
                    question: "Dependency injection là gì?", // vn-ok: asserts localized vi output.
                    deckTitle: "Nền tảng Backend", // vn-ok: asserts localized vi output.
                })
                expect(query).toHaveBeenNthCalledWith(1,
                    expect.stringContaining("flashcard_deck_translations"),
                    [Locale.Vi,
                        ["00000000-0000-4000-8000-000000000001"]])
                expect(query).toHaveBeenNthCalledWith(2,
                    expect.stringContaining("flashcard_card_translations"),
                    [Locale.Vi,
                        ["00000000-0000-4000-8000-000000000002"]])
            })
    })
