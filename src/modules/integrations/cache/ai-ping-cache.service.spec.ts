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
    })
