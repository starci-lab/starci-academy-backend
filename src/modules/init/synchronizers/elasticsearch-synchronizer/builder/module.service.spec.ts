import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    ElasticsearchModuleBuildService,
} from "./module.service"

describe("ElasticsearchModuleBuildService",
    () => {
        it("trims localized module labels before building suggestions",
            async () => {
                const transform = jest.fn((entity: { title: string }) => {
                    entity.title = `  ${entity.title}  `
                })
                const service = new ElasticsearchModuleBuildService(
                    {
                        loadById: jest.fn().mockResolvedValue({
                            id: "module-1",
                            title: "Module",
                            orderIndex: 2,
                        }),
                    } as never,
                    {
                        transform,
                    } as never,
                    {
                    } as never,
                )

                const documents = await service.buildMultilingualByModuleId("module-1")

                expect(documents).toHaveLength(Object.values(Locale).length)
                expect(documents[0]?.entity).toEqual(expect.objectContaining({
                    title: "  Module  ",
                    suggest: {
                        input: ["Module"],
                        weight: 98,
                    },
                }))
                expect(transform).toHaveBeenCalledTimes(Object.values(Locale).length)
            })

        it("delegates every localized module document to Elasticsearch",
            async () => {
                const indexEntity = jest.fn().mockResolvedValue(undefined)
                const service = new ElasticsearchModuleBuildService(
                    {
                        loadById: jest.fn().mockResolvedValue({
                            id: "module-1",
                            title: "Module",
                            orderIndex: 0,
                        }),
                    } as never,
                    {
                        transform: jest.fn(),
                    } as never,
                    {
                        indexEntity,
                    } as never,
                )

                await service.buildIndexById("module-1")

                expect(indexEntity).toHaveBeenCalledTimes(Object.values(Locale).length)
                expect(indexEntity).toHaveBeenCalledWith(expect.objectContaining({
                    locale: Locale.Vi,
                }))
            })
    })
