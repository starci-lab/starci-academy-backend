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

        it("subscribes without a queue and forwards handler failures to onError",
            async () => {
                const sub = {
                    drain: jest.fn().mockResolvedValue(undefined),
                    async *[Symbol.asyncIterator]() {
                        yield {
                            data: "message",
                        }
                    },
                }
                const nc = {
                    subscribe: jest.fn().mockReturnValue(sub),
                }
                const onError = jest.fn()
                const connection = new NatsStreamConnection({
                    nc: nc as never,
                    subjects: ["events"],
                })
                connection.onData(() => {
                    throw "handler failure"
                })
                connection.onError(onError)

                await connection.onOpen(jest.fn())
                await new Promise((resolve) => setImmediate(resolve))
                await connection.close()

                expect(nc.subscribe).toHaveBeenCalledWith("events")
                expect(onError).toHaveBeenCalledWith(expect.objectContaining({
                    message: "handler failure",
                }))
            })
    })
