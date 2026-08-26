import {
    MyFlashcardQuizHistoryService
} from "./my-flashcard-quiz-history.service"
describe("MyFlashcardQuizHistoryService",
    () => {
        it("returns an empty paginated history",
            async () => {
                const manager = {
                    findAndCount: jest.fn().mockResolvedValue([[],
                        0])
                }
                const userService = {
                    resolveOrCreateTrialEnrollment: jest.fn().mockResolvedValue({
                        id: "enrollment"
                    })
                }
                const service = new MyFlashcardQuizHistoryService(manager as never,
userService as never)
                await expect(service.list({
                    userId: "u", courseId: "c", limit: 10, offset: 0
                })).resolves.toEqual({
                    totalCount: 0, items: []
                })
            })
        it("maps completed sessions and counts fully correct quizzes",
            async () => {
                const session = {
                    id: "s", updatedAt: new Date(), mode: "quick", level: "easy", cardIds: ["a",
                        "b"], results: [{
                        totalBlanks: 1, correctBlanks: 1
                    },
                    {
                        totalBlanks: 2, correctBlanks: 1
                    }], coverage: 80, xpEarned: 4, weakTags: null, name: "Run"
                }
                const manager = {
                    findAndCount: jest.fn().mockResolvedValue([[session],
                        1])
                }
                const service = new MyFlashcardQuizHistoryService(manager as never,
{
    resolveOrCreateTrialEnrollment: jest.fn().mockResolvedValue({
        id: "e"
    })
} as never)
                await expect(service.list({
                    userId: "u", courseId: "c", limit: 10, offset: 0
                })).resolves.toMatchObject({
                    totalCount: 1, items: [{
                        cardCount: 2, correctCount: 1, weakTags: []
                    }]
                })
            })
    })
