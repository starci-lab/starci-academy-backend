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

        it("preserves weak tags and excludes zero-blank results from the correct count",
            async () => {
                const manager = {
                    findAndCount: jest.fn().mockResolvedValue([[
                        {
                            id: "s-2",
                            updatedAt: new Date(0),
                            mode: "deep",
                            level: null,
                            cardIds: ["a"],
                            results: [{
                                totalBlanks: 0,
                                correctBlanks: 0,
                            }],
                            coverage: null,
                            xpEarned: 0,
                            weakTags: [{
                                tag: "arrays",
                                coverage: 0.2,
                            }],
                            name: null,
                        },
                    ],
                    1])
                }
                const service = new MyFlashcardQuizHistoryService(manager as never,
                    {
                        resolveOrCreateTrialEnrollment: jest.fn().mockResolvedValue({
                            id: "e-2",
                        }),
                    } as never)

                await expect(service.list({
                    userId: "u",
                    courseId: "c",
                    limit: 5,
                    offset: 3,
                })).resolves.toMatchObject({
                    items: [{
                        correctCount: 0,
                        weakTags: [{
                            tag: "arrays",
                        }],
                        name: null,
                    }],
                })
                expect(manager.findAndCount).toHaveBeenCalledWith(expect.anything(),
                    expect.objectContaining({
                        take: 5,
                        skip: 3,
                    }))
            })
    })
