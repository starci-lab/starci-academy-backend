import {
    WebSocketStreamConnection
} from "./ws.adapter"
import WebSocket from "ws"
describe("WebSocketStreamConnection",
    () => {
        it("registers handlers and closes an open socket",
            async () => {
                const socket = {
                    readyState: WebSocket.OPEN, on: jest.fn(), close: jest.fn()
                }
                const connection = new WebSocketStreamConnection(socket as never)
                await connection.onOpen(jest.fn()); connection.onData(jest.fn()); connection.onError(jest.fn()); connection.onClose(jest.fn()); await connection.close()
                expect(socket.on).toHaveBeenCalledTimes(4); expect(socket.close).toHaveBeenCalled()
            })
        it("does not close an already closed socket",
            async () => {
                const socket = {
                    readyState: WebSocket.CLOSED, on: jest.fn(), close: jest.fn()
                }
                await new WebSocketStreamConnection(socket as never).close()
                expect(socket.close).not.toHaveBeenCalled()
            })
    })
