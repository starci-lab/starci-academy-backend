import {
    createClient, createCluster
} from "redis"
import {
    createRedisProvider, createRedisShutdownProvider
} from "./redis.providers"
import {
    RedisInstanceKey
} from "./enums/instance-key"
jest.mock("redis",
    () => ({
        createClient: jest.fn(), createCluster: jest.fn()
    }))
describe("redis providers",
    () => {
        it("creates a standalone client from the provider factory",
            async () => {
                const client = {
                    connect: jest.fn()
                }; (createClient as jest.Mock).mockReturnValue(client)
                const provider = createRedisProvider(RedisInstanceKey.Cache) as { useFactory: () => Promise<unknown> }
                await expect(provider.useFactory()).resolves.toBe(client)
                expect(createClient).toHaveBeenCalled()
            })
        it("creates a shutdown owner that quits an open client",
            async () => {
                const quit = jest.fn().mockResolvedValue(undefined)
                const provider = createRedisShutdownProvider(RedisInstanceKey.Cache) as { useFactory: (client: unknown) => { onModuleDestroy: () => Promise<void> } }
                await provider.useFactory({
                    isOpen: true, quit
                }).onModuleDestroy()
                expect(quit).toHaveBeenCalled()
                expect(createCluster).not.toHaveBeenCalled()
            })
    })
