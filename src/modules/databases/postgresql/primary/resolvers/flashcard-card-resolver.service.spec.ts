import {
    Locale,
} from "../enums/locale"
import {
    FlashcardCardResolverService,
} from "./flashcard-card-resolver.service"

describe("FlashcardCardResolverService",
    () => {
        it("resolves all card fields and removes raw translations",
            () => {
                const resolve = jest.fn().mockImplementation(
                    (params: { field: string }) => ({
                        question: "Translated question",
                        answer: "Translated answer",
                        explanation: "Translated explanation",
                    }[params.field]),
                )
                const card = {
                    question: "Question",
                    answer: "Answer",
                    explanation: "Explanation",
                    defaultLocale: null,
                    translations: [
                        {
                            field: "question",
                            value: "Translated question",
                        },
                    ],
                }
                const service = new FlashcardCardResolverService({
                    resolve,
                } as never)

                service.transform(card as never,
                    Locale.Vi,
                    Locale.En)

                expect(card.question).toBe("Translated question")
                expect(card.answer).toBe("Translated answer")
                expect(card.explanation).toBe("Translated explanation")
                expect(card).not.toHaveProperty("translations")
                expect(resolve).toHaveBeenNthCalledWith(1,
                    expect.objectContaining({
                        field: "question",
                        locale: Locale.Vi,
                        fallbackLocale: Locale.En,
                    }))
            })

        it("keeps nullable base values when translations resolve empty",
            () => {
                const resolve = jest.fn().mockReturnValue("")
                const card = {
                    question: "Base question",
                    answer: "Base answer",
                    explanation: null,
                    defaultLocale: Locale.En,
                    translations: [],
                }
                const service = new FlashcardCardResolverService({
                    resolve,
                } as never)

                service.transform(card as never,
                    Locale.Vi,
                    Locale.En)

                expect(card.question).toBe("")
                expect(card.answer).toBe("Base answer")
                expect(card.explanation).toBeNull()
                expect(resolve).toHaveBeenCalledTimes(3)
                expect(resolve).toHaveBeenCalledWith(
                    expect.objectContaining({
                        fallbackLocale: Locale.En,
                    }),
                )
            })
    })
