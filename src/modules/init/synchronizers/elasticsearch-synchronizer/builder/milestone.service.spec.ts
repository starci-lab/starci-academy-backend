import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    ElasticsearchMilestoneBuildService,
} from "./milestone.service"

describe("ElasticsearchMilestoneBuildService",
    () => {
        it("builds localized milestone suggestions with a bounded weight",
            async () => {
                const transform = jest.fn((entity: { title: string }, locale: Locale) => {
                    entity.title = `${locale} milestone`
                })
                const service = new ElasticsearchMilestoneBuildService(
                    {
                        loadById: jest.fn().mockResolvedValue({
                            id: "milestone-1",
                            title: "Milestone",
                            orderIndex: 140,
                        }),
                    } as never,
                    {
                        transform,
                    } as never,
                    {
                        indexEntity: jest.fn(),
                    } as never,
                )

                const documents = await service.buildMultilingualByMilestoneId("milestone-1")

                expect(documents).toHaveLength(Object.values(Locale).length)
                expect(transform).toHaveBeenCalledTimes(Object.values(Locale).length)
                expect(documents[0]?.entity).toEqual(expect.objectContaining({
                    title: `${documents[0]?.locale} milestone`,
                    suggest: {
                        input: [`${documents[0]?.locale} milestone`],
                        weight: 1,
                    },
                }))
            })

        it("indexes every localized milestone document",
            async () => {
                const indexEntity = jest.fn().mockResolvedValue(undefined)
                const service = new ElasticsearchMilestoneBuildService(
                    {
                        loadById: jest.fn().mockResolvedValue({
                            id: "milestone-1",
                            title: "Milestone",
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

                await service.buildIndexById("milestone-1")

                expect(indexEntity).toHaveBeenCalledTimes(Object.values(Locale).length)
                expect(indexEntity).toHaveBeenCalledWith(expect.objectContaining({
                    locale: Locale.En,
                }))
            })
    })
