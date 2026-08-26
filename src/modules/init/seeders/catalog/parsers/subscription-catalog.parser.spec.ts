import {
    SubscriptionCatalogParserService
} from "./subscription-catalog.parser"
import {
    AiSubTier
} from "@modules/databases/postgresql/primary/enums/ai-sub-tier"
import {
    CoerceMdScalarService,
} from "../../shared/extracts/coerce-md-scalar.service"

describe("SubscriptionCatalogParserService",
    () => {
        it("skips unreadable entries and sorts valid tiers",
            async () => {
                const service = new SubscriptionCatalogParserService({
                    paths: jest.fn().mockResolvedValue([
                        {
                            relativePath: "0-pro", displayId: AiSubTier.Pro
                        },
                    ]),
                } as never,
{
    load: jest.fn().mockRejectedValueOnce(new Error("missing")),
} as never,
{
    extract: jest.fn()
} as never,
{
} as never,
{
    log: jest.fn()
} as never)

                await expect(service.parseMany()).resolves.toEqual([])
            })

        it("maps a valid tier with scalar defaults",
            async () => {
                const service = new SubscriptionCatalogParserService({
                    paths: jest.fn().mockResolvedValue([{
                        relativePath: "1-plus", displayId: AiSubTier.Plus
                    }]),
                } as never,
{
    load: jest.fn().mockResolvedValue("md")
} as never,
{
    extract: jest.fn().mockReturnValue({
        tier: AiSubTier.Plus, description: "Plus", priceVnd: 10, priceUsd: 1, creditsPer5h: 2, creditsPerWeek: 3, enabled: true
    }),
} as never,
{
    toRequiredEnum: jest.fn((_v: unknown, _e: object, fallback: unknown) => fallback),
    toNullableString: jest.fn((v: unknown) => v as string),
    toRequiredString: jest.fn((v: unknown, f: string) => v ?? f),
    toRequiredNumber: jest.fn((v: unknown, f: number) => typeof v === "number" ? v : f),
    toNullableBoolean: jest.fn((v: unknown) => v as boolean),
    toRequiredBoolean: jest.fn((v: unknown, f: boolean) => typeof v === "boolean" ? v : f),
} as never,
{
    log: jest.fn()
} as never)

                await expect(service.parseMany()).resolves.toEqual([expect.objectContaining({
                    tier: AiSubTier.Plus, priceVnd: 10, enabled: true
                })])
            })

        it("skips rows with invalid tier and non-finite required numeric fields",
            async () => {
                const valid = {
                    tier: AiSubTier.Plus,
                    displayName: "Plus",
                    description: "Description",
                    priceVnd: 10,
                    priceUsd: 1,
                    creditsPer5h: 2,
                    creditsPerWeek: 3,
                    popular: false,
                    enabled: true,
                }
                const extract = jest.fn()
                    .mockReturnValueOnce({
                        ...valid, tier: "unknown"
                    })
                    .mockReturnValueOnce({
                        ...valid, priceVnd: Number.NaN
                    })
                    .mockReturnValueOnce({
                        ...valid, creditsPer5h: Number.NaN
                    })
                    .mockReturnValueOnce({
                        ...valid, creditsPerWeek: Number.NaN
                    })
                    .mockReturnValueOnce({
                        ...valid, enabled: "yes"
                    })
                const log = jest.fn()
                const service = new SubscriptionCatalogParserService(
                    {
                        paths: jest.fn().mockResolvedValue([
                            {
                                relativePath: "0-unknown", displayId: "unknown"
                            },
                            {
                                relativePath: "1-plus", displayId: AiSubTier.Plus
                            },
                            {
                                relativePath: "2-plus", displayId: AiSubTier.Plus
                            },
                            {
                                relativePath: "3-plus", displayId: AiSubTier.Plus
                            },
                            {
                                relativePath: "4-plus", displayId: AiSubTier.Plus
                            },
                        ]),
                    } as never,
                    {
                        load: jest.fn().mockResolvedValue("md")
                    } as never,
                    {
                        extract
                    } as never,
                    {
                        toRequiredEnum: jest.fn((value: unknown, values: object, fallback: unknown) =>
                            Object.values(values).includes(value) ? value : fallback),
                        toNullableString: jest.fn((value: unknown) => value as string),
                        toRequiredString: jest.fn((value: unknown, fallback: string) => value ?? fallback),
                        toRequiredNumber: jest.fn((value: unknown, fallback: number) =>
                            typeof value === "number" ? value : fallback),
                        toNullableBoolean: jest.fn((value: unknown) => value as boolean),
                        toRequiredBoolean: jest.fn((value: unknown) => value),
                    } as never,
                    {
                        log
                    } as never,
                )

                await expect(service.parseMany()).resolves.toEqual([])
                expect(log).toHaveBeenCalledTimes(5)
            })

        it("orders valid tiers according to the public plan order",
            async () => {
                const extract = jest.fn()
                    .mockReturnValueOnce({
                        tier: AiSubTier.Max,
                        description: "Max",
                        priceVnd: 30,
                        priceUsd: 3,
                        creditsPer5h: 3,
                        creditsPerWeek: 30,
                        enabled: true,
                    })
                    .mockReturnValueOnce({
                        tier: AiSubTier.Plus,
                        description: "Plus",
                        priceVnd: 10,
                        priceUsd: 1,
                        creditsPer5h: 1,
                        creditsPerWeek: 10,
                        enabled: true,
                    })
                const service = new SubscriptionCatalogParserService(
                    {
                        paths: jest.fn().mockResolvedValue([
                            {
                                relativePath: "0-max", displayId: AiSubTier.Max
                            },
                            {
                                relativePath: "1-plus", displayId: AiSubTier.Plus
                            },
                        ]),
                    } as never,
                    {
                        load: jest.fn().mockResolvedValue("markdown")
                    } as never,
                    {
                        extract
                    } as never,
                    new CoerceMdScalarService(),
                    {
                        log: jest.fn()
                    } as never,
                )

                await expect(service.parseMany()).resolves.toEqual([
                    expect.objectContaining({
                        tier: AiSubTier.Plus
                    }),
                    expect.objectContaining({
                        tier: AiSubTier.Max
                    }),
                ])
            })
    })
