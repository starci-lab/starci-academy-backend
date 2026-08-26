import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    ElasticsearchFlashcardDeckBuildService,
} from "./flashcard-deck.service"

describe("ElasticsearchFlashcardDeckBuildService",
    () => {
        const deck = {
            id: "deck-1",
            title: "Deck",
            orderIndex: 2,
            defaultLocale: Locale.En,
            cards: [],
            translations: [],
        }

        it("loads the full deck graph and localizes one document per locale",
            async () => {
                const findOneOrFail = jest.fn().mockResolvedValue(deck)
                const transform = jest.fn()
                const service = new ElasticsearchFlashcardDeckBuildService(
                    {
                        findOneOrFail,
                    } as never,
                    {
                        indexEntity: jest.fn(),
                    } as never,
                    {
                        transform,
                    } as never,
                )

                const documents = await service.buildMultilingualByFlashcardDeckId("deck-1")

                expect(findOneOrFail).toHaveBeenCalledWith(expect.anything(),
                    expect.objectContaining({
                        where: {
                            id: "deck-1",
                        },
                        relations: expect.objectContaining({
                            cards: {
                                translations: true,
                            },
                        }),
                    }))
                expect(transform).toHaveBeenCalledTimes(Object.values(Locale).length)
                expect(documents).toHaveLength(Object.values(Locale).length)
                expect(documents[0]?.entity.suggest).toEqual(expect.objectContaining({
                    input: ["Deck"],
                    weight: 98,
                }))
            })

        it("indexes every localized deck document",
            async () => {
                const indexEntity = jest.fn().mockResolvedValue(undefined)
                const service = new ElasticsearchFlashcardDeckBuildService(
                    {
                        findOneOrFail: jest.fn().mockResolvedValue(deck),
                    } as never,
                    {
                        indexEntity,
                    } as never,
                    {
                        transform: jest.fn(),
                    } as never,
                )

                await service.buildIndexById("deck-1")

                expect(indexEntity).toHaveBeenCalledTimes(Object.values(Locale).length)
                expect(indexEntity).toHaveBeenCalledWith(expect.objectContaining({
                    locale: Locale.Vi,
                }))
            })
    })
