import {
    InMemoryQueryResultCache
} from "./in-memory-query-result-cache"

describe("InMemoryQueryResultCache",
    () => {
        it("stores by identifier, expires by ttl, and removes entries",
            async () => {
                const cache = new InMemoryQueryResultCache({
                } as never)
                const entry = {
                    identifier: "id", result: "value", time: Date.now(), duration: 1000
                }
                await cache.storeInCache(entry)
                await expect(cache.getFromCache({
                    identifier: "id", duration: 1000
                })).resolves.toBe(entry)
                expect(cache.isExpired({
                    time: Date.now() - 2000, duration: 1
                })).toBe(true)
                await cache.remove(["id"])
                await expect(cache.getFromCache({
                    identifier: "id", duration: 1000
                })).resolves.toBeUndefined()
            })
        it("falls back to query and clears on disconnect",
            async () => {
                const cache = new InMemoryQueryResultCache({
                } as never)
                const entry = {
                    query: "SELECT 1", result: [], duration: 1000
                }
                await cache.storeInCache(entry)
                await expect(cache.getFromCache({
                    query: "SELECT 1", duration: 1000
                })).resolves.toBe(entry)
                await cache.disconnect()
                await expect(cache.getFromCache({
                    query: "SELECT 1", duration: 1000
                })).resolves.toBeUndefined()
            })
    })
