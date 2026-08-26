import {
    AiSubscriptionTiersResolver
} from "./ai-subscription-tiers.resolver"

describe("AiSubscriptionTiersResolver",
    () => {
        it("filters disabled tiers and applies display and popular defaults",
            async () => {
                const appConfig = jest.fn().mockReturnValue({
                    subscriptions: {
                        tiers: [
                            {
                                tier: "plus",
                                displayName: undefined,
                                description: "For learners",
                                priceVnd: 100,
                                priceUsd: 4.25,
                                creditsPer5h: 10,
                                creditsPerWeek: 50,
                                enabled: true,
                                popular: 1,
                            },
                            {
                                tier: "legacy",
                                displayName: "Legacy",
                                description: "Hidden",
                                enabled: false,
                            },
                            {
                                tier: "pro",
                                displayName: "Pro",
                                description: "For builders",
                                priceVnd: 200,
                                priceUsd: 8,
                                creditsPer5h: 20,
                                creditsPerWeek: 100,
                                enabled: true,
                                popular: false,
                            },
                        ],
                    },
                })
                const resolver = new AiSubscriptionTiersResolver({
                    appConfig
                } as never)

                await expect(resolver.execute()).resolves.toEqual({
                    tiers: [
                        {
                            tier: "plus",
                            displayName: "plus",
                            description: "For learners",
                            priceVnd: 100,
                            priceUsd: 4.25,
                            creditsPer5h: 10,
                            creditsPerWeek: 50,
                            popular: true,
                        },
                        {
                            tier: "pro",
                            displayName: "Pro",
                            description: "For builders",
                            priceVnd: 200,
                            priceUsd: 8,
                            creditsPer5h: 20,
                            creditsPerWeek: 100,
                            popular: false,
                        },
                    ],
                })
                expect(appConfig).toHaveBeenCalledTimes(1)
            })

        it("returns an empty catalog and propagates config errors",
            async () => {
                const appConfig = jest.fn().mockReturnValue({
                    subscriptions: {
                        tiers: [],
                    },
                })
                const resolver = new AiSubscriptionTiersResolver({
                    appConfig
                } as never)
                await expect(resolver.execute()).resolves.toEqual({
                    tiers: []
                })

                const failure = new Error("config unavailable")
                appConfig.mockImplementationOnce(() => {
                    throw failure
                })
                await expect(resolver.execute()).rejects.toBe(failure)
            })
    })
