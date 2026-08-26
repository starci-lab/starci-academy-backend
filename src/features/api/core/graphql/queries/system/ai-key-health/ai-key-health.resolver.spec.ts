import {
    KeyStatus
} from "@modules/ai/balancer/enums/key-status"
import {
    AiKeyHealthResolver
} from "./ai-key-health.resolver"

describe("AiKeyHealthResolver",
    () => {
        it("maps active and inactive keys to the public healthy flag",
            async () => {
                const modelKeyHealth = jest.fn().mockResolvedValue({
                    groups: [
                        {
                            provider: "openai",
                            models: ["gpt-4o",
                                "gpt-4o-mini"],
                            totalKeys: 2,
                            activeKeys: 1,
                            keys: [
                                {
                                    keyMask: "sk-...1234",
                                    status: KeyStatus.Active,
                                },
                                {
                                    keyMask: "sk-...5678",
                                    status: KeyStatus.Disabled,
                                },
                            ],
                        },
                    ],
                })
                const resolver = new AiKeyHealthResolver({
                    modelKeyHealth
                } as never)

                await expect(resolver.execute()).resolves.toEqual({
                    groups: [
                        {
                            provider: "openai",
                            models: ["gpt-4o",
                                "gpt-4o-mini"],
                            totalKeys: 2,
                            healthyKeys: 1,
                            keys: [
                                {
                                    keyMask: "sk-...1234",
                                    healthy: true,
                                },
                                {
                                    keyMask: "sk-...5678",
                                    healthy: false,
                                },
                            ],
                        },
                    ],
                })
                expect(modelKeyHealth).toHaveBeenCalledTimes(1)
            })

        it("returns empty groups and propagates service failures",
            async () => {
                const modelKeyHealth = jest.fn().mockResolvedValue({
                    groups: []
                })
                const resolver = new AiKeyHealthResolver({
                    modelKeyHealth
                } as never)
                await expect(resolver.execute()).resolves.toEqual({
                    groups: []
                })

                const failure = new Error("health unavailable")
                modelKeyHealth.mockRejectedValueOnce(failure)
                await expect(resolver.execute()).rejects.toBe(failure)
            })
    })
