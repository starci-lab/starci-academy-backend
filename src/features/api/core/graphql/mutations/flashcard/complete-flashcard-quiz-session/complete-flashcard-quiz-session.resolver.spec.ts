import {
    CompleteFlashcardQuizSessionResolver
} from "./complete-flashcard-quiz-session.resolver"

describe("CompleteFlashcardQuizSessionResolver",
    () => {
        it("passes no client score or course identity to completion",
            async () => {
                const complete = jest.fn().mockResolvedValue({
                    scorePercent: 100
                })
                const resolver = new CompleteFlashcardQuizSessionResolver({
                    complete
                } as never)
                const request = {
                    sessionId: "00000000-0000-4000-8000-000000000001",
                    expectedVersion: 3,
                    selections: [],
                }
                await resolver.execute(request,
{
    id: "user-1"
} as never)
                expect(complete).toHaveBeenCalledWith({
                    userId: "user-1", ...request
                })
            })
    })
