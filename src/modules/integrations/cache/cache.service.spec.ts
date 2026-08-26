import {
    CacheService
} from "./cache.service"
import {
    CacheKey
} from "./enums/cache-key"
import {
    CacheType
} from "./enums/cache-type"

describe("CacheService",
    () => {
        const make = () => {
            const redis = {
                get: jest.fn(), set: jest.fn(), del: jest.fn()
            }
            const memory = {
                get: jest.fn(), set: jest.fn(), del: jest.fn()
            }
            const service = new CacheService(redis as never,
memory as never,
{
    stringify: jest.fn(JSON.stringify), parse: jest.fn(JSON.parse)
} as never,
{
    log: jest.fn()
} as never)
            return {
                service, redis, memory
            }
        }
        it("gets missing values and sets memory values",
            async () => {
                const { service, redis, memory } = make()
                await expect(service.get({
                    key: CacheKey.EntityLabel, args: ["id"]
                } as never)).resolves.toBeUndefined()
                await service.set({
                    key: CacheKey.EntityLabel, args: ["id"], cacheResult: "value", cacheType: CacheType.Memory
                } as never)
                expect(redis.set).not.toHaveBeenCalled()
                expect(memory.set).toHaveBeenCalled()
            })
        it("parses a redis cache hit and deletes by key",
            async () => {
                const { service, redis } = make()
                redis.get.mockResolvedValue(JSON.stringify({
                    value: 1
                }))
                await expect(service.get({
                    key: CacheKey.EntityLabel, args: ["id"]
                } as never)).resolves.toEqual({
                    value: 1
                })
                await service.del({
                    key: CacheKey.EntityLabel, args: ["id"]
                })
                expect(redis.del).toHaveBeenCalled()
            })
    })
