import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    CdnContentBuildService,
} from "./content.service"

describe("CdnContentBuildService",
    () => {
        it("uses English when a content has no default locale and transforms each locale",
            async () => {
                const transform = jest.fn((entity: { localized?: Locale }, locale: Locale,
                    fallback: Locale) => {
                    entity.localized = locale
                    expect(fallback).toBe(Locale.En)
                })
                const service = new CdnContentBuildService(
                    {
                        loadById: jest.fn().mockResolvedValue({
                            id: "content-1"
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

                const localized = await service.buildMultilingualByContentId("content-1")

                expect(localized.map((entry) => entry.locale)).toEqual([Locale.Vi,
                    Locale.En])
                const entities = localized as unknown as Array<{ entity: { localized?: Locale } }>
                expect(entities.map((entry) => entry.entity.localized)).toEqual([Locale.Vi,
                    Locale.En])
                expect(transform).toHaveBeenCalledTimes(2)
            })

        it("materializes localized content and delegates the resolved key",
            async () => {
                let resolveObjectKey: ((id: string, locale: Locale) => string) | undefined
                const process = jest.fn(async (...args: unknown[]) => {
                    resolveObjectKey = args[1] as (id: string, locale: Locale) => string
                })
                const service = new CdnContentBuildService(
                    {
                        loadById: jest.fn().mockResolvedValue({
                            id: "content-2"
                        })
                    } as never,
                    {
                        transform: jest.fn()
                    } as never,
                    {
                        content: jest.fn((id: string, locale: Locale) => `${id}/${locale}`)
                    } as never,
                    {
                        process
                    } as never,
                )

                await service.materializeAndUpload("content-2")

                expect(process).toHaveBeenCalledTimes(1)
                expect(resolveObjectKey?.("content-2",
                    Locale.Vi)).toBe("content-2/vi")
            })
    })
