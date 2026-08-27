import {
    ClozeParserService
} from "@modules/bussiness/flashcard/cloze/cloze-parser.service"
import {
    FlashcardQuizEligibilityService
} from "./flashcard-quiz-eligibility.service"

describe("FlashcardQuizEligibilityService",
    () => {
        it("counts only cards with canonical valid blanks and performs no write",
            async () => {
                const entityManager = {
                    query: jest.fn().mockResolvedValue([
                        {
                            answer: "{{c1::valid}}"
                        },
                        {
                            answer: "{{c0::literal}}"
                        },
                        {
                            answer: "plain"
                        },
                    ]),
                }
                const result = await new FlashcardQuizEligibilityService(
                    entityManager as never,
                    new ClozeParserService(),
                ).find("user-1",
                    "course-1",
                    [],
                    2)
                expect(result).toEqual({
                    eligibleCount: 1,
                    requestedCount: 2,
                    canStart: false,
                    reason: "INSUFFICIENT_CLOZE_CARDS",
                })
                expect(entityManager.query).toHaveBeenCalledTimes(1)
            })
    })
