import {
    AiBalancerHealthResolver
} from "./ai-balancer-health.resolver"

describe("AiBalancerHealthResolver",
    () => {
        it("maps provider and key health details without changing nullable timestamps",
            async () => {
                const lastUsedAt = new Date("2026-01-01T00:00:00.000Z")
                const healthSnapshot = jest.fn().mockResolvedValue({
                    providers: [
                        {
                            provider: "openai",
                            keysFilePath: "/run/secrets/openai.keys",
                            totalKeys: 2,
                            activeKeys: 1,
                            disabledKeys: 1,
                            keys: [
                                {
                                    provider: "openai",
                                    keySuffix: "1234",
                                    status: "active",
                                    failCount: 0,
                                    lastUsedAt,
                                    lastHealthCheckAt: null,
                                    disabledAt: null,
                                },
                            ],
                        },
                    ],
                })
                const resolver = new AiBalancerHealthResolver({
                    healthSnapshot
                } as never)

                await expect(resolver.execute()).resolves.toEqual({
                    providers: [
                        {
                            provider: "openai",
                            keysFilePath: "/run/secrets/openai.keys",
                            totalKeys: 2,
                            activeKeys: 1,
                            disabledKeys: 1,
                            keys: [
                                {
                                    provider: "openai",
                                    keySuffix: "1234",
                                    status: "active",
                                    failCount: 0,
                                    lastUsedAt,
                                    lastHealthCheckAt: null,
                                    disabledAt: null,
                                },
                            ],
                        },
                    ],
                })
                expect(healthSnapshot).toHaveBeenCalledTimes(1)
            })

        it("returns no providers and propagates balancer failures",
            async () => {
                const healthSnapshot = jest.fn().mockResolvedValue({
                    providers: []
                })
                const resolver = new AiBalancerHealthResolver({
                    healthSnapshot
                } as never)
                await expect(resolver.execute()).resolves.toEqual({
                    providers: []
                })

                const failure = new Error("balancer unavailable")
                healthSnapshot.mockRejectedValueOnce(failure)
                await expect(resolver.execute()).rejects.toBe(failure)
            })
    })
