import {
    MyFlashcardQuizSessionBySessionIdResolver
} from "./my-flashcard-quiz-session-by-session-id.resolver"

describe("MyFlashcardQuizSessionBySessionIdResolver",
    () => {
        it("delegates the viewer/session IDs and maps a missing result",
            async () => {
                const find = jest.fn().mockResolvedValue(null)
                const resolver = new MyFlashcardQuizSessionBySessionIdResolver({
                    find
                } as never)

                await expect(resolver.execute({
                    id: "user-1"
                } as never,
                "session-1")).resolves.toBeNull()
                expect(find).toHaveBeenCalledWith({
                    userId: "user-1", sessionId: "session-1"
                })
            })

        it("maps nullable fields to GraphQL-friendly undefined values",
            async () => {
                const find = jest.fn().mockResolvedValue({
                    sessionId: "s1",
                    status: "completed",
                    mode: "mixed",
                    level: null,
                    coverage: null,
                    xpEarned: 3,
                    cardCount: 1,
                    answeredCount: 1,
                    fullyCorrectCount: 1,
                    durationSeconds: null,
                    weakTags: [{
                        tag: "x", coverage: 1, moduleId: null, contentId: null
                    }],
                    results: [],
                })
                const resolver = new MyFlashcardQuizSessionBySessionIdResolver({
                    find
                } as never)

                await expect(resolver.execute({
                    id: "u1"
                } as never,
                "s1")).resolves.toMatchObject({
                    sessionId: "s1",
                    level: undefined,
                    coverage: undefined,
                    durationSeconds: undefined,
                    weakTags: [{
                        tag: "x", moduleId: undefined, contentId: undefined
                    }],
                })
            })
    })
