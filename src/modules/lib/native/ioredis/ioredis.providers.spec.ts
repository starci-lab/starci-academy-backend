import type {
    RedisOrCluster,
} from "./types/client"
import {
    IoRedisClientShutdown,
} from "./ioredis.providers"

interface ClientFixture {
    status: string
    quit: jest.Mock<Promise<string>, []>
    disconnect: jest.Mock<void, []>
}

const clientFixture = (status = "ready"): ClientFixture => ({
    status,
    quit: jest.fn().mockResolvedValue("OK"),
    disconnect: jest.fn(),
})

const shutdownFor = (client: ClientFixture): IoRedisClientShutdown =>
    new IoRedisClientShutdown(client as unknown as RedisOrCluster)

describe("IoRedisClientShutdown",
    () => {
        it("leaves an ended client alone",
            async () => {
                const client = clientFixture("end")

                await shutdownFor(client).onModuleDestroy()

                expect(client.quit).not.toHaveBeenCalled()
                expect(client.disconnect).not.toHaveBeenCalled()
            })

        it("quits an active client gracefully",
            async () => {
                const client = clientFixture()

                await shutdownFor(client).onModuleDestroy()

                expect(client.quit).toHaveBeenCalledTimes(1)
                expect(client.disconnect).not.toHaveBeenCalled()
            })

        it("disconnects when graceful quit fails",
            async () => {
                const client = clientFixture()
                client.quit.mockRejectedValue(new Error("connection closed"))

                await shutdownFor(client).onModuleDestroy()

                expect(client.disconnect).toHaveBeenCalledTimes(1)
            })
    })
