import {
    MyFlashcardQuizSessionBySessionIdService
} from "./my-flashcard-quiz-session-by-session-id.service"

describe("MyFlashcardQuizSessionBySessionIdService",
    () => {
        it("returns null for an unknown or unauthorized session",
            async () => {
                const findOne = jest.fn().mockResolvedValue(null)
                const service = new MyFlashcardQuizSessionBySessionIdService({
                    findOne
                } as never)

                await expect(service.find({
                    userId: "u1", sessionId: "missing"
                })).resolves.toBeNull()
                expect(findOne).toHaveBeenCalledWith(expect.anything(),
                    {
                        where: {
                            id: "missing",
                            enrollment: {
                                user: {
                                    id: "u1"
                                }
                            },
                        },
                    })
            })

        it("maps persisted results, weak tags, correctness, and duration",
            async () => {
                const session = {
                    id: "s1",
                    status: "completed",
                    mode: "mixed",
                    level: "beginner",
                    coverage: 80,
                    xpEarned: 25,
                    cardIds: ["c1",
                        "c2"],
                    results: [
                        {
                            cardId: "c1", correctBlanks: 2, totalBlanks: 2
                        },
                        {
                            cardId: "c2", correctBlanks: 1, totalBlanks: 2
                        },
                    ],
                    weakTags: [{
                        tag: "arrays", coverage: 40, moduleId: undefined, contentId: "ct1"
                    }],
                    createdAt: new Date("2026-01-01T00:00:00Z"),
                    updatedAt: new Date("2026-01-01T00:00:12Z"),
                }
                const service = new MyFlashcardQuizSessionBySessionIdService({
                    findOne: jest.fn().mockResolvedValue(session),
                } as never)

                await expect(service.find({
                    userId: "u1", sessionId: "s1"
                })).resolves.toEqual({
                    sessionId: "s1",
                    status: "completed",
                    mode: "mixed",
                    level: "beginner",
                    coverage: 80,
                    xpEarned: 25,
                    cardCount: 2,
                    answeredCount: 2,
                    fullyCorrectCount: 1,
                    durationSeconds: 12,
                    weakTags: [{
                        tag: "arrays", coverage: 40, moduleId: null, contentId: "ct1"
                    }],
                    results: session.results,
                })
            })
    })
