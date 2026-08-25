import {
    FlashcardDeckRetention, MyFlashcardReviewStatsData 
} from "./response"
describe("flashcard review stats response DTOs",
    () => { it("represents retention and review aggregates",
        () => { const retention = Object.assign(new FlashcardDeckRetention(),
            {
                deckId: "d1", deckTitle: "Core", retentionPercent: 75, dueCount: 3 
            }); const data = Object.assign(new MyFlashcardReviewStatsData(),
            {
                totalReviewed: 10, streakDays: 2, decks: [retention] 
            }); expect(data).toMatchObject({
            totalReviewed: 10, decks: [{
                retentionPercent: 75, dueCount: 3 
            }] 
        }) }) })
