import {
    CacheKey,
} from "./enums/cache-key"
import {
    ModelProvider,
} from "@modules/databases/postgresql/primary/enums/model-provider"
import {
    AiModelLatencyCacheService,
} from "./ai-model-latency-cache.service"

describe("AiModelLatencyCacheService",
    () => {
        it("initializes and returns an empty map when the cache is missing",
            async () => {
                const get = jest.fn().mockResolvedValue(undefined)
                const set = jest.fn().mockResolvedValue(undefined)
                const service = new AiModelLatencyCacheService({
                    get, set
                } as never)

                await service.onModuleInit()
                const result = await service.getAll()

                expect(result).toEqual({
                })
                expect(set).toHaveBeenCalledWith({
                    key: CacheKey.AiModelLatency,
                    cacheResult: {
                    },
                })
                expect(set).toHaveBeenCalledTimes(2)
            })

        it("preserves an existing map and records both successful and failed probes",
            async () => {
                const existing = {
                    "model-old": {
                        provider: "openai",
                        ok: true,
                        latencyMs: 12,
                        checkedAt: "2024-01-01T00:00:00.000Z",
                    },
                }
                const get = jest.fn().mockResolvedValue(existing)
                const set = jest.fn().mockResolvedValue(undefined)
                const service = new AiModelLatencyCacheService({
                    get, set
                } as never)

                await service.recordModelLatency({
                    model: "model-new",
                    provider: ModelProvider.Anthropic,
                    ok: false,
                    latencyMs: 0,
                    errorMessage: "rate limited",
                })

                expect(get).toHaveBeenCalledWith({
                    key: CacheKey.AiModelLatency,
                })
                expect(set).toHaveBeenCalledWith(expect.objectContaining({
                    key: CacheKey.AiModelLatency,
                    cacheResult: expect.objectContaining({
                        "model-old": existing["model-old"],
                        "model-new": expect.objectContaining({
                            provider: ModelProvider.Anthropic,
                            ok: false,
                            latencyMs: 0,
                            errorMessage: "rate limited",
                            checkedAt: expect.any(String),
                        }),
                    }),
                }))
            })
    })
