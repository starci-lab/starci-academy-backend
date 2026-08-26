import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    CdnModuleBuildService,
} from "./module.service"

describe("CdnModuleBuildService",
    () => {
        it("clones and transforms a hydrated module for every locale",
            async () => {
                const transform = jest.fn((entity: { localized?: Locale }, locale: Locale) => {
                    entity.localized = locale
                })
                const service = new CdnModuleBuildService(
                    {
                        loadById: jest.fn().mockResolvedValue({
                            id: "module-1"
                        })
                    } as never,
                    {
                        transform
                    } as never,
                    {
                    } as never,
                    {
                    } as never,
                )

                const localized = await service.buildMultilingualByModuleId("module-1")

                expect(localized.map((entry) => entry.locale)).toEqual([Locale.Vi,
                    Locale.En])
                const entities = localized as unknown as Array<{ entity: { localized?: Locale } }>
                expect(entities.map((entry) => entry.entity.localized)).toEqual([Locale.Vi,
                    Locale.En])
                expect(transform).toHaveBeenCalledTimes(2)
            })

        it("materializes a module and resolves its localized object key",
            async () => {
                let resolveObjectKey: ((id: string, locale: Locale) => string) | undefined
                const process = jest.fn(async (...args: unknown[]) => {
                    resolveObjectKey = args[1] as (id: string, locale: Locale) => string
                })
                const service = new CdnModuleBuildService(
                    {
                        loadById: jest.fn().mockResolvedValue({
                            id: "module-2"
                        })
                    } as never,
                    {
                        transform: jest.fn()
                    } as never,
                    {
                        module: jest.fn((id: string, locale: Locale) => `${id}/${locale}`)
                    } as never,
                    {
                        process
                    } as never,
                )

                await service.materializeAndUpload("module-2")

                expect(process).toHaveBeenCalledTimes(1)
                expect(resolveObjectKey?.("module-2",
                    Locale.Vi)).toBe("module-2/vi")
            })
    })
