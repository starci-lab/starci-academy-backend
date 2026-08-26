jest.mock("@nestjs/graphql",
    () => ({
        registerEnumType: jest.fn()
    }))
import {
    AiPingCacheService
} from "./ai-ping-cache.service"
import {
    ModelProvider
} from "@modules/databases/postgresql/primary/enums/model-provider"

interface CacheSetParams {
    cacheResult: unknown
}

describe("AiPingCacheService",
    () => {
        it("records success and cooldown state",
            async () => {
                const store: Record<string, unknown> = {
                }; const cache = {
                    get: jest.fn().mockImplementation(async () => store.value), set: jest.fn().mockImplementation(async ({ cacheResult }: CacheSetParams) => { store.value = cacheResult })
                }; const now = {
                    toISOString: () => "2026-01-01T00:00:00.000Z", add: () => now
                }; const service = new AiPingCacheService(cache as never,
{
    now: () => now
} as never)
                await service.recordKeySuccess({
                    provider: ModelProvider.OpenAI, key: "k"
                }); expect((await service.getProviderMap(ModelProvider.OpenAI)).k.status).toBe(true)
                await service.recordKeyCooldown({
                    provider: ModelProvider.OpenAI, key: "k", cooldownMs: 1000
                }); expect((await service.getProviderMap(ModelProvider.OpenAI)).k.failCount).toBe(1)
            })

        it("initializes a missing map and preserves key metadata on pick",
            async () => {
                let stored: unknown
                const cache = {
                    get: jest.fn().mockImplementation(async () => stored),
                    set: jest.fn().mockImplementation(async ({ cacheResult }: CacheSetParams) => {
                        stored = cacheResult
                    }),
                }
                const now = {
                    toISOString: () => "2026-01-01T00:00:00.000Z",
                    add: () => now,
                }
                const service = new AiPingCacheService(cache as never,
{
    now: () => now
} as never)

                await service.onModuleInit()
                await service.recordKeyPicked({
                    provider: ModelProvider.OpenAI, key: "new-key"
                })

                expect(cache.set).toHaveBeenCalledTimes(2)
                const map = await service.getProviderMap(ModelProvider.OpenAI)
                expect(map["new-key"]).toEqual(expect.objectContaining({
                    status: true, lastUsedAt: "2026-01-01T00:00:00.000Z"
                }))
            })

        it("routes ping outcomes to healthy and transient cooldown states",
            async () => {
                const cache = {
                    get: jest.fn().mockResolvedValue({
                    }),
                    set: jest.fn().mockResolvedValue(undefined),
                }
                const now = {
                    toISOString: () => "2026-01-01T00:00:00.000Z",
                    add: () => now,
                }
                const service = new AiPingCacheService(cache as never,
                    {
                        now: () => now,
                    } as never)

                await service.recordPingKeyStatus({
                    provider: ModelProvider.OpenAI,
                    key: "healthy",
                    success: true,
                })
                await service.recordPingKeyStatus({
                    provider: ModelProvider.OpenAI,
                    key: "flaky",
                    success: false,
                })

                const map = await service.getProviderMap(ModelProvider.OpenAI)
                expect(map.healthy).toEqual(expect.objectContaining({
                    status: true,
                }))
                expect(map.flaky).toEqual(expect.objectContaining({
                    status: false,
                    failCount: 1,
                }))
            })

        it("uses the disabled cooldown and increments an existing failure count",
            async () => {
                const map = {
                    [ModelProvider.OpenAI]: {
                        key: {
                            status: false,
                            lastPing: "old",
                            failCount: 2,
                            disabled: false,
                        },
                    },
                }
                const cache = {
                    get: jest.fn().mockResolvedValue(map),
                    set: jest.fn().mockResolvedValue(undefined),
                }
                const now = {
                    toISOString: () => "2026-01-01T00:00:00.000Z",
                    add: jest.fn().mockReturnThis(),
                }
                const service = new AiPingCacheService(cache as never,
                    {
                        now: () => now,
                    } as never)

                await service.recordKeyCooldown({
                    provider: ModelProvider.OpenAI,
                    key: "key",
                    cooldownMs: 1000,
                    disabled: true,
                })

                expect(now.add).toHaveBeenCalledWith(24 * 60 * 60 * 1000,
                    "millisecond")
                expect(map[ModelProvider.OpenAI].key).toEqual(expect.objectContaining({
                    status: false,
                    failCount: 3,
                    disabled: true,
                }))
            })
    })
