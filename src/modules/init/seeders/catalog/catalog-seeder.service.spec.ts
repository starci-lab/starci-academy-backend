import {
    CatalogSeederService
} from "./catalog-seeder.service"

describe("CatalogSeederService",
    () => {
        it("returns without parsing when both catalog gates are disabled",
            async () => {
                const parser = {
                    parseManyWithTranslations: jest.fn(), parseMany: jest.fn()
                }
                const scope = {
                    isAiModelsCatalogSeederEnabled: jest.fn().mockReturnValue(false),
                    isSubscriptionsCatalogSeederEnabled: jest.fn().mockReturnValue(false),
                }
                const service = new CatalogSeederService(parser as never,
parser as never,
{
} as never,
{
} as never,
{
} as never,
{
} as never,
{
    log: jest.fn()
} as never,
scope as never)

                await expect(service.seed()).resolves.toBeUndefined()
                expect(parser.parseManyWithTranslations).not.toHaveBeenCalled()
                expect(parser.parseMany).not.toHaveBeenCalled()
            })

        it("syncs enabled model and subscription results and logs counts",
            async () => {
                const model = {
                    model: {
                        name: "test"
                    }, en: {
                    }, vi: {
                    }
                }
                const parser = {
                    parseManyWithTranslations: jest.fn().mockResolvedValue([model]),
                    parseMany: jest.fn().mockResolvedValue([{
                        tier: "pro"
                    }]),
                }
                const insert = {
                    upsertMany: jest.fn().mockResolvedValue(1)
                }
                const invalidate = jest.fn().mockResolvedValue(undefined)
                const reloadAll = jest.fn().mockResolvedValue(undefined)
                const applyAppConfig = jest.fn()
                const log = jest.fn()
                const scope = {
                    isAiModelsCatalogSeederEnabled: jest.fn().mockReturnValue(true),
                    isSubscriptionsCatalogSeederEnabled: jest.fn().mockReturnValue(false),
                }
                const service = new CatalogSeederService(parser as never,
parser as never,
insert as never,
{
    invalidate
} as never,
{
    applyAppConfig
} as never,
{
    reloadAll
} as never,
{
    log
} as never,
scope as never)

                await service.seed()
                expect(insert.upsertMany).toHaveBeenCalledWith([model])
                expect(invalidate).toHaveBeenCalled()
                expect(reloadAll).toHaveBeenCalled()
                expect(applyAppConfig).not.toHaveBeenCalled()
                expect(log).toHaveBeenCalledTimes(1)
            })
    })
