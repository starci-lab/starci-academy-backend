import {
    NatsStreamConnection
} from "./nats.adapter"

describe("NatsStreamConnection",
    () => {
        it("subscribes with queue groups, dispatches messages, and closes",
            async () => {
                const msg = {
                    data: "data"
                }
                const sub = {
                    drain: jest.fn().mockResolvedValue(undefined), async *[Symbol.asyncIterator]() { yield msg }
                }
                const nc = {
                    subscribe: jest.fn().mockReturnValue(sub)
                }
                const data = jest.fn()
                const close = jest.fn()
                const connection = new NatsStreamConnection({
                    nc: nc as never, subjects: ["a"], queueGroup: "group"
                })
                connection.onData(data)
                connection.onClose(close)
                await connection.onOpen(jest.fn())
                await new Promise((resolve) => setImmediate(resolve))
                await connection.close()
                expect(nc.subscribe).toHaveBeenCalledWith("a",
                    {
                        queue: "group"
                    })
                expect(data).toHaveBeenCalledWith(msg)
                expect(sub.drain).toHaveBeenCalled()
                expect(close).toHaveBeenCalled()
            })
    })
