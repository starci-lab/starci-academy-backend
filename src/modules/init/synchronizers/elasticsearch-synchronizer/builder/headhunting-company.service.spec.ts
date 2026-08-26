import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    ElasticsearchHeadhunterCompanyBuildService,
} from "./headhunting-company.service"

describe("ElasticsearchHeadhunterCompanyBuildService",
    () => {
        const company = {
            id: "company-1",
            title: "Company",
            orderIndex: 5,
        }

        it("builds localized company suggestions from hydrated data",
            async () => {
                const service = new ElasticsearchHeadhunterCompanyBuildService(
                    {
                        loadById: jest.fn().mockResolvedValue(company),
                    } as never,
                    {
                        transform: jest.fn(),
                    } as never,
                    {
                        indexEntity: jest.fn(),
                    } as never,
                )

                const documents = await service.buildMultilingualByCompanyId("company-1")

                expect(documents).toHaveLength(Object.values(Locale).length)
                expect(documents[0]?.entity.suggest).toEqual(expect.objectContaining({
                    input: ["Company"],
                    weight: 95,
                }))
            })

        it("indexes one document for each supported locale",
            async () => {
                const indexEntity = jest.fn().mockResolvedValue(undefined)
                const service = new ElasticsearchHeadhunterCompanyBuildService(
                    {
                        loadById: jest.fn().mockResolvedValue(company),
                    } as never,
                    {
                        transform: jest.fn(),
                    } as never,
                    {
                        indexEntity,
                    } as never,
                )

                await service.buildIndexById("company-1")

                expect(indexEntity).toHaveBeenCalledTimes(Object.values(Locale).length)
                expect(indexEntity).toHaveBeenCalledWith(expect.objectContaining({
                    locale: Locale.En,
                }))
            })
    })
