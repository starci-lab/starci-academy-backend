import {
    MyInProgressFlashcardQuizSessionResolver,
} from "./my-in-progress-flashcard-quiz-session.resolver"

describe("MyInProgressFlashcardQuizSessionResolver",
    () => {
        it("returns null when no resumable quiz exists",
            async () => {
                const find = jest.fn().mockResolvedValue(null)
                await expect(new MyInProgressFlashcardQuizSessionResolver({
                    find,
                } as never).execute({
                    id: "user-1",
                } as never,
                "course-1")).resolves.toBeNull()
                expect(find).toHaveBeenCalledWith({
                    userId: "user-1",
                    courseId: "course-1",
                })
            })

        it("maps a resumable session and derives its deadline",
            async () => {
                const createdAt = new Date("2026-08-01T00:00:00.000Z")
                const updatedAt = new Date("2026-08-01T01:00:00.000Z")
                const find = jest.fn().mockResolvedValue({
                    sessionId: "session-1",
                    cardIds: ["card-1"],
                    currentIndex: 1,
                    results: [],
                    createdAt,
                    updatedAt,
                    name: null,
                })

                const result = await new MyInProgressFlashcardQuizSessionResolver({
                    find,
                } as never).execute({
                    id: "user-1",
                } as never,
                "course-1")

                expect(result).toEqual(expect.objectContaining({
                    sessionId: "session-1",
                    updatedAt: updatedAt.toISOString(),
                    deadlineAt: expect.any(String),
                    name: null,
                }))
            })
    })
