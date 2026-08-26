import {
    RedisIoAdapter,
} from "./redis-io-adapter"

describe("RedisIoAdapter",
    () => {
        it("duplicates and connects Redis clients, then closes open clients",
            async () => {
                const pubClient = {
                    connect: jest.fn().mockResolvedValue(undefined),
                    isOpen: true,
                    quit: jest.fn().mockResolvedValue(undefined),
                    on: jest.fn(),
                }
                const subClient = {
                    connect: jest.fn().mockResolvedValue(undefined),
                    isOpen: false,
                    quit: jest.fn().mockResolvedValue(undefined),
                    psubscribe: jest.fn(),
                    subscribe: jest.fn(),
                    on: jest.fn(),
                }
                const redisClient = {
                    duplicate: jest.fn()
                        .mockReturnValueOnce(pubClient)
                        .mockReturnValueOnce(subClient),
                }
                const adapter = new RedisIoAdapter({
                } as never)

                adapter.setClient(redisClient as never)
                await adapter.connect()
                adapter.createIOServer(0)
                await adapter.close({
                    close: (callback: () => void) => callback(),
                } as never)

                expect(redisClient.duplicate).toHaveBeenCalledTimes(2)
                expect(pubClient.connect).toHaveBeenCalledTimes(1)
                expect(subClient.connect).toHaveBeenCalledTimes(1)
                expect(pubClient.quit).toHaveBeenCalledTimes(1)
                expect(subClient.quit).not.toHaveBeenCalled()
            })

        it("propagates a Redis connection failure",
            async () => {
                const connect = jest.fn().mockRejectedValue(new Error("redis unavailable"))
                const redisClient = {
                    duplicate: jest.fn().mockReturnValue({
                        connect,
                        psubscribe: jest.fn(),
                        subscribe: jest.fn(),
                        on: jest.fn(),
                    }),
                }
                const adapter = new RedisIoAdapter({
                } as never)
                adapter.setClient(redisClient as never)

                await expect(adapter.connect()).rejects.toThrow("redis unavailable")
            })
    })
