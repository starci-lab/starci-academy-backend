import {
    AdvertisementSeederService
} from "./advertisement-seeder.service"
import {
    AdvertisementMediaType,
} from "@modules/databases/postgresql/primary/enums/advertisement-media-type"
import {
    AdvertisementPlacement,
} from "@modules/databases/postgresql/primary/enums/advertisement-placement"
import * as fs from "node:fs"

jest.mock("node:fs",
    () => {
        const actual = jest.requireActual<typeof import("node:fs")>("node:fs")
        return {
            ...actual,
            existsSync: jest.fn(),
            readFileSync: jest.fn(),
        }
    })

describe("AdvertisementSeederService",
    () => {
        it("honors the disabled seeder gate",
            async () => {
                const upsert = jest.fn()
                const service = new AdvertisementSeederService({
                    upsert
                } as never,
{
    isAdvertisementsSeederEnabled: jest.fn().mockReturnValue(false)
} as never,
{
} as never,
{
} as never)
                await expect(service.seed()).resolves.toBeUndefined()
                expect(upsert).not.toHaveBeenCalled()
            })

        it("parses and upserts advertisement rows with scalar defaults",
            async () => {
                const exists = fs.existsSync as jest.MockedFunction<typeof fs.existsSync>
                const readFile = fs.readFileSync as jest.MockedFunction<typeof fs.readFileSync>
                exists.mockReturnValue(true)
                readFile.mockReturnValue("markdown" as never)
                const upsert = jest.fn().mockResolvedValue(undefined)
                const extract = jest.fn().mockReturnValue({
                    data: [{
                        slug: "hero",
                        placement: "dashboard_right",
                        mediaType: "image",
                        media: {
                            url: "/hero.png"
                        },
                        title: {
                            en: "Hero"
                        },
                        linkUrl: "/learn",
                        isHouseAd: "true",
                        priority: "3",
                        isActive: "false",
                    }],
                })
                const coerce = {
                    toRequiredString: jest.fn((value: unknown, fallback: string) => value || fallback),
                    toRequiredEnum: jest.fn((value: unknown, values: object, fallback: unknown) => value || fallback),
                    toNullableStringColumn: jest.fn((value: unknown) => value ?? null),
                    toRequiredBoolean: jest.fn((value: unknown, fallback: boolean) => value === undefined ? fallback : value === "true"),
                    toNullableDate: jest.fn((value: unknown) => value ?? null),
                    toRequiredNumber: jest.fn((value: unknown, fallback: number) => value === undefined ? fallback : Number(value)),
                }
                const service = new AdvertisementSeederService(
                {
                    upsert
                } as never,
                {
                    isAdvertisementsSeederEnabled: jest.fn().mockReturnValue(true)
                } as never,
                {
                    extract
                } as never,
                coerce as never,
                )

                await service.seed()

                expect(extract).toHaveBeenCalledWith("markdown")
                expect(upsert).toHaveBeenCalledWith(expect.anything(),
                    expect.objectContaining({
                        slug: "hero",
                        placement: "dashboard_right",
                        mediaType: "image",
                        ctaText: null,
                        priority: 3,
                        isActive: false,
                    }),
                    ["slug"])
                expect(coerce.toRequiredEnum).toHaveBeenCalledWith(
                    "dashboard_right",
                    AdvertisementPlacement,
                    AdvertisementPlacement.DashboardRight,
                )
                expect(coerce.toRequiredEnum).toHaveBeenCalledWith(
                    "image",
                    AdvertisementMediaType,
                    AdvertisementMediaType.Image,
                )
            })

        it("returns without parsing when no advertisement file is available",
            async () => {
                const exists = fs.existsSync as jest.MockedFunction<typeof fs.existsSync>
                exists.mockReturnValue(false)
                const extract = jest.fn()
                const service = new AdvertisementSeederService(
                {
                    upsert: jest.fn()
                } as never,
                {
                    isAdvertisementsSeederEnabled: jest.fn().mockReturnValue(true)
                } as never,
                {
                    extract
                } as never,
                {
                } as never,
                )

                await expect(service.seed()).resolves.toBeUndefined()
                expect(extract).not.toHaveBeenCalled()
            })
    })
