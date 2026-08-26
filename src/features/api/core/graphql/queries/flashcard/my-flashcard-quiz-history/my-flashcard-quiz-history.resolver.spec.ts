import {
    MyFlashcardQuizHistoryResolver,
} from "./my-flashcard-quiz-history.resolver"

describe("MyFlashcardQuizHistoryResolver",
    () => {
        it("clamps pagination and serializes completed session dates",
            async () => {
                const updatedAt = new Date("2026-08-01T00:00:00.000Z")
                const list = jest.fn().mockResolvedValue({
                    totalCount: 1,
                    items: [{
                        id: "session-1",
                        updatedAt,
                        mode: "quick",
                        level: null,
                        cardCount: 3,
                        correctCount: 2,
                        coverage: null,
                        xpEarned: 4,
                        weakTags: [],
                        name: null,
                    }],
                })

                await expect(new MyFlashcardQuizHistoryResolver({
                    list,
                } as never).execute({
                    id: "user-1",
                } as never,
                "course-1",
                999,
                -2)).resolves.toEqual({
                    totalCount: 1,
                    items: [expect.objectContaining({
                        id: "session-1",
                        updatedAt: updatedAt.toISOString(),
                    })],
                })
                expect(list).toHaveBeenCalledWith(expect.objectContaining({
                    userId: "user-1",
                    courseId: "course-1",
                    limit: 50,
                    offset: 0,
                }))
            })
    })
