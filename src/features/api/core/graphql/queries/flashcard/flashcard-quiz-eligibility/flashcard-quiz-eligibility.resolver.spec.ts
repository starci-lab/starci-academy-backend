import {
    FlashcardQuizEligibilityResolver
} from "./flashcard-quiz-eligibility.resolver"

describe("FlashcardQuizEligibilityResolver",
    () => {
        it("binds the authenticated learner to the requested scope",
            async () => {
                const find = jest.fn().mockResolvedValue({
                    canStart: true
                })
                const resolver = new FlashcardQuizEligibilityResolver({
                    find
                } as never)
                await resolver.execute({
                    courseId: "course-1",
                    deckIds: ["deck-1"],
                    requestedItemCount: 5,
                },
{
    id: "user-1"
} as never)
                expect(find).toHaveBeenCalledWith("user-1",
                    "course-1",
                    ["deck-1"],
                    5)
            })
    })
