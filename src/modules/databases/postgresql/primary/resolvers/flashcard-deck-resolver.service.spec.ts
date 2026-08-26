import {
    Locale,
} from "../enums/locale"
import {
    FlashcardDeckResolverService,
} from "./flashcard-deck-resolver.service"

describe("FlashcardDeckResolverService",
    () => {
        it("falls back to base fields, resolves cards, and removes translation rows",
            () => {
                const cardResolver = {
                    transform: jest.fn()
                }
                const resolve = jest.fn().mockReturnValue("")
                const service = new FlashcardDeckResolverService({
                    resolve
                } as never,
cardResolver as never)
                const card = {
                    id: "card-1"
                }
                const deck = {
                    title: "Base title",
                    description: "Base description",
                    defaultLocale: undefined,
                    translations: [],
                    cards: [card],
                }

                service.transform(deck as never,
                    Locale.Vi,
                    Locale.En)

                expect(deck.title).toBe("Base title")
                expect(deck.description).toBe("Base description")
                expect(cardResolver.transform).toHaveBeenCalledWith(card,
                    Locale.Vi,
                    Locale.En)
                expect(deck).not.toHaveProperty("translations")
            })
    })
