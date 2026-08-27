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
                    kind: "ACTIVE_V1",
                    sessionId: "session-1",
                    contractVersion: 1,
                    items: [],
                    currentIndex: 1,
                    answerState: [],
                    answerVersion: 2,
                    status: "in_progress",
                    createdAt,
                    updatedAt,
                })

                const result = await new MyInProgressFlashcardQuizSessionResolver({
                    find,
                } as never).execute({
                    id: "user-1",
                } as never,
                "course-1")

                expect(result).toEqual(expect.objectContaining({
                    sessionId: "session-1",
                    kind: "ACTIVE_V1",
                    answerVersion: 2,
                    updatedAt: updatedAt.toISOString(),
                    deadlineAt: expect.any(String),
                }))
            })

        it("returns typed recovery without exposing a legacy session",
            async () => {
                const find = jest.fn().mockResolvedValue({
                    kind: "RECOVER_TO_SETUP",
                    reason: "LEGACY_OR_INVALID_SESSION",
                })
                await expect(new MyInProgressFlashcardQuizSessionResolver({
                    find
                } as never).execute({
                    id: "user-1",
                } as never,
                "course-1")).resolves.toEqual({
                    kind: "RECOVER_TO_SETUP",
                    reason: "LEGACY_OR_INVALID_SESSION",
                })
            })
    })
