import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    CdnChallengeBuildService,
} from "./challenge.service"

describe("CdnChallengeBuildService",
    () => {
        it("localizes a hydrated challenge with its explicit fallback locale",
            async () => {
                const challenge = {
                    id: "challenge-1",
                    displayId: "challenge-one",
                    defaultLocale: Locale.Vi,
                }
                const transform = jest.fn((entity: { localized?: Locale }, locale: Locale,
                    fallback: Locale) => {
                    entity.localized = locale
                    expect(fallback).toBe(Locale.Vi)
                })
                const service = new CdnChallengeBuildService(
                    {
                        loadById: jest.fn().mockResolvedValue(challenge)
                    } as never,
                    {
                        transform
                    } as never,
                    {
                    } as never,
                    {
                    } as never,
                )

                const localized = await service.buildMultilingualByChallengeId("challenge-1")

                expect(localized).toHaveLength(Object.values(Locale).length)
                expect(localized.map((entry) => entry.locale)).toEqual([Locale.Vi,
                    Locale.En])
                const entities = localized as unknown as Array<{ entity: { localized?: Locale } }>
                expect(entities.map((entry) => entry.entity.localized)).toEqual([Locale.Vi,
                    Locale.En])
                expect(transform).toHaveBeenCalledTimes(2)
            })

        it("materializes localized challenges and resolves an object key",
            async () => {
                let resolveObjectKey: ((id: string, locale: Locale) => string) | undefined
                const process = jest.fn(async (...args: unknown[]) => {
                    resolveObjectKey = args[1] as (id: string, locale: Locale) => string
                })
                const service = new CdnChallengeBuildService(
                    {
                        loadById: jest.fn().mockResolvedValue({
                            id: "challenge-2"
                        })
                    } as never,
                    {
                        transform: jest.fn()
                    } as never,
                    {
                        challenge: jest.fn((id: string, locale: Locale) => `${id}-${locale}`)
                    } as never,
                    {
                        process
                    } as never,
                )

                await service.materializeAndUpload("challenge-2")

                expect(process).toHaveBeenCalledTimes(1)
                expect(resolveObjectKey?.("id-2",
                    Locale.En)).toBe("id-2-en")
            })
    })
