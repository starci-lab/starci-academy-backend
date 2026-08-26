import {
    EventSourceStreamConnection
} from "./eventsource.adapter"
import {
    EventSource
} from "eventsource"
describe("EventSourceStreamConnection",
    () => {
        it("registers all handlers and closes an active connection",
            async () => {
                const source = {
                    readyState: EventSource.OPEN, addEventListener: jest.fn(), close: jest.fn()
                }
                const connection = new EventSourceStreamConnection(source as never)
                await connection.onOpen(jest.fn()); connection.onData(jest.fn()); connection.onError(jest.fn()); connection.onClose(jest.fn()); await connection.close()
                expect(source.addEventListener).toHaveBeenCalledTimes(4); expect(source.close).toHaveBeenCalled()
            })
        it("leaves a closed source untouched",
            async () => {
                const source = {
                    readyState: EventSource.CLOSED, addEventListener: jest.fn(), close: jest.fn()
                }
                await new EventSourceStreamConnection(source as never).close()
                expect(source.close).not.toHaveBeenCalled()
            })
    })
