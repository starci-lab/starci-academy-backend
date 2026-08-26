import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    ElasticsearchFoundationCategoryBuildService,
} from "./foundation-category.service"

describe("ElasticsearchFoundationCategoryBuildService",
    () => {
        type CompletionSuggest = {
            input: Array<string>
            weight: number
        }

        const category = {
            id: "category-1",
            title: "Foundation",
            orderIndex: 4,
        }

        it("builds localized category suggestions with normalized labels",
            async () => {
                const transform = jest.fn()
                    .mockImplementation((entity: { title: string }, locale: Locale) => {
                        entity.title = locale === Locale.Vi
                            ? "Nền tảng TypeScript" // vn-ok: exercises the runtime Vietnamese title prefix normalization
                            : "TypeScript Foundation"
                    })
                const service = new ElasticsearchFoundationCategoryBuildService(
                    {
                        loadById: jest.fn().mockResolvedValue(category),
                    } as never,
                    {
                        transform,
                    } as never,
                    {
                        indexEntity: jest.fn(),
                    } as never,
                )

                const documents = await service.buildMultilingualByCategoryId("category-1")

                expect(documents).toHaveLength(Object.values(Locale).length)
                const suggestions = documents.map((document) => (
                    document.entity as unknown as { suggest: CompletionSuggest }
                ).suggest)
                expect(suggestions.map((suggest) => suggest.input)).toEqual([
                    ["TypeScript"],
                    ["TypeScript"],
                ])
                expect(suggestions[0]?.weight).toBe(96)
            })

        it("indexes every localized category document",
            async () => {
                const indexEntity = jest.fn().mockResolvedValue(undefined)
                const service = new ElasticsearchFoundationCategoryBuildService(
                    {
                        loadById: jest.fn().mockResolvedValue(category),
                    } as never,
                    {
                        transform: jest.fn(),
                    } as never,
                    {
                        indexEntity,
                    } as never,
                )

                await service.buildIndexById("category-1")

                expect(indexEntity).toHaveBeenCalledTimes(Object.values(Locale).length)
            })
    })
