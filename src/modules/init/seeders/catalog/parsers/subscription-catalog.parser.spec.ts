import {
    SubscriptionCatalogParserService
} from "./subscription-catalog.parser"
import {
    AiSubTier
} from "@modules/databases/postgresql/primary/enums/ai-sub-tier"

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
    })
