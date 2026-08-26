import {
    MyFlashcardReviewSessionBySessionIdResolver
} from "./my-flashcard-review-session-by-session-id.resolver"
describe("MyFlashcardReviewSessionBySessionIdResolver",
    () => {
        const user = {
            id: "u"
        }
        const base = {
            sessionId: "s", cardIds: ["c"], currentIndex: 0, reviewedCount: 0, xpEarned: 2, updatedAt: new Date()
        }
        it("maps a deck session and defaults graded indexes",
            async () => {
                const deck = {
                    ...base, deckId: "d", deckTitle: "Deck", gradedIndexes: undefined
                }
                const resolver = new MyFlashcardReviewSessionBySessionIdResolver({
                    findById: jest.fn().mockResolvedValue(deck)
                } as never,
{
    findById: jest.fn()
} as never)
                await expect(resolver.execute(user as never,
                    "s")).resolves.toMatchObject({
                    kind: "deck", deckId: "d", gradedIndexes: []
                })
            })
        it("falls through to due sessions and returns null when neither exists",
            async () => {
                const due = {
                    ...base, gradedIndexes: [1]
                }
                const deck = {
                    findById: jest.fn().mockResolvedValue(null)
                }
                const dueService = {
                    findById: jest.fn().mockResolvedValueOnce(due).mockResolvedValueOnce(null)
                }
                const resolver = new MyFlashcardReviewSessionBySessionIdResolver(deck as never,
dueService as never)
                await expect(resolver.execute(user as never,
                    "s")).resolves.toMatchObject({
                    kind: "due", gradedIndexes: [1]
                })
                await expect(resolver.execute(user as never,
                    "missing")).resolves.toBeNull()
            })
    })
