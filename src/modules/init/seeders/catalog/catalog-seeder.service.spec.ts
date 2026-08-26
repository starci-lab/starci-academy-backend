import {
    CatalogSeederService
} from "./catalog-seeder.service"

jest.mock("@modules/filesystem/utils/mount-secrets",
    () => ({
        getAppConfig: jest.fn().mockReturnValue({
        }),
    }))

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

        it("updates app config for subscription tiers while leaving empty model catalogs untouched",
            async () => {
                const parser = {
                    parseManyWithTranslations: jest.fn().mockResolvedValue([]),
                    parseMany: jest.fn().mockResolvedValue([{
                        id: "pro"
                    }]),
                }
                const applyAppConfig = jest.fn()
                const log = jest.fn()
                const service = new CatalogSeederService(
                    parser as never,
                    parser as never,
                    {
                        upsertMany: jest.fn()
                    } as never,
                    {
                        invalidate: jest.fn()
                    } as never,
                    {
                        applyAppConfig
                    } as never,
                    {
                        reloadAll: jest.fn()
                    } as never,
                    {
                        log
                    } as never,
                    {
                        isAiModelsCatalogSeederEnabled: jest.fn().mockReturnValue(true),
                        isSubscriptionsCatalogSeederEnabled: jest.fn().mockReturnValue(true),
                    } as never,
                )

                await service.seed()

                expect(applyAppConfig).toHaveBeenCalledWith(expect.objectContaining({
                    subscriptions: {
                        tiers: [{
                            id: "pro"
                        }]
                    },
                }))
                expect(log).toHaveBeenCalledTimes(2)
                expect(log).toHaveBeenCalledWith(expect.anything(),
                    {
                        seeder: "ai-models",
                        upserted: 0,
                    })
                expect(log).toHaveBeenCalledWith(expect.anything(),
                    {
                        seeder: "subscriptions",
                        upserted: 1,
                    })
            })

        it("propagates parser failures instead of logging a false completion",
            async () => {
                const failure = new Error("catalog unavailable")
                const log = jest.fn()
                const service = new CatalogSeederService(
                    {
                        parseManyWithTranslations: jest.fn().mockRejectedValue(failure)
                    } as never,
                    {
                        parseMany: jest.fn()
                    } as never,
                    {
                        upsertMany: jest.fn()
                    } as never,
                    {
                        invalidate: jest.fn()
                    } as never,
                    {
                        applyAppConfig: jest.fn()
                    } as never,
                    {
                        reloadAll: jest.fn()
                    } as never,
                    {
                        log
                    } as never,
                    {
                        isAiModelsCatalogSeederEnabled: jest.fn().mockReturnValue(true),
                        isSubscriptionsCatalogSeederEnabled: jest.fn().mockReturnValue(false),
                    } as never,
                )

                await expect(service.seed()).rejects.toThrow("catalog unavailable")
                expect(log).not.toHaveBeenCalled()
            })

        it("reloads the key store only after a non-empty model catalog is persisted",
            async () => {
                const model = {
                    id: "model-1",
                }
                const upsertMany = jest.fn().mockResolvedValue(undefined)
                const invalidate = jest.fn().mockResolvedValue(undefined)
                const reloadAll = jest.fn().mockResolvedValue(undefined)
                const service = new CatalogSeederService(
                    {
                        parseManyWithTranslations: jest.fn().mockResolvedValue([model]),
                    } as never,
                    {
                        parseMany: jest.fn().mockResolvedValue([]),
                    } as never,
                    {
                        upsertMany,
                    } as never,
                    {
                        invalidate,
                    } as never,
                    {
                        applyAppConfig: jest.fn(),
                    } as never,
                    {
                        reloadAll,
                    } as never,
                    {
                        log: jest.fn(),
                    } as never,
                    {
                        isAiModelsCatalogSeederEnabled: jest.fn().mockReturnValue(true),
                        isSubscriptionsCatalogSeederEnabled: jest.fn().mockReturnValue(false),
                    } as never,
                )

                await service.seed()

                expect(upsertMany).toHaveBeenCalledWith([model])
                expect(invalidate).toHaveBeenCalled()
                expect(reloadAll).toHaveBeenCalled()
            })

        it("skips model work and config writes when subscriptions are enabled but empty",
            async () => {
                const parseManyWithTranslations = jest.fn().mockResolvedValue([])
                const parseMany = jest.fn().mockResolvedValue([])
                const applyAppConfig = jest.fn()
                const service = new CatalogSeederService(
                    {
                        parseManyWithTranslations
                    } as never,
                    {
                        parseMany
                    } as never,
                    {
                        upsertMany: jest.fn()
                    } as never,
                    {
                        invalidate: jest.fn()
                    } as never,
                    {
                        applyAppConfig
                    } as never,
                    {
                        reloadAll: jest.fn()
                    } as never,
                    {
                        log: jest.fn()
                    } as never,
                    {
                        isAiModelsCatalogSeederEnabled: jest.fn().mockReturnValue(false),
                        isSubscriptionsCatalogSeederEnabled: jest.fn().mockReturnValue(true),
                    } as never,
                )
                await service.seed()
                expect(parseManyWithTranslations).not.toHaveBeenCalled()
                expect(parseMany).toHaveBeenCalledTimes(1)
                expect(applyAppConfig).not.toHaveBeenCalled()
            })
    })
