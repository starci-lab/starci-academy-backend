import {
    WsResponseService,
} from "./response.service"

describe("WsResponseService",
    () => {
        it("emits success payloads to a client, room, and broadcast namespace",
            () => {
                const service = new WsResponseService({
                } as never)
                const client = {
                    emit: jest.fn(),
                }
                const room = {
                    emit: jest.fn(),
                }
                const namespace = {
                    to: jest.fn().mockReturnValue(room),
                    emit: jest.fn(),
                }

                service.success({
                    client: client as never,
                    eventName: "client-event",
                    message: "ok",
                    data: {
                        id: 1,
                    },
                })
                service.successToRoom({
                    namespace: namespace as never,
                    room: "room-1",
                    eventName: "room-event",
                    message: "ready",
                    data: ["item"],
                })
                service.broadcast({
                    namespace: namespace as never,
                    eventName: "broadcast-event",
                    message: "updated",
                    data: true,
                })

                expect(client.emit).toHaveBeenCalledWith("client-event",
                    {
                        success: true,
                        message: "ok",
                        data: {
                            id: 1,
                        },
                    })
                expect(namespace.to).toHaveBeenCalledWith("room-1")
                expect(room.emit).toHaveBeenCalledWith("room-event",
                    expect.objectContaining({
                        success: true,
                        data: ["item"],
                    }))
                expect(namespace.emit).toHaveBeenCalledWith("broadcast-event",
                    expect.objectContaining({
                        success: true,
                        data: true,
                    }))
            })

        it("uses supplied error details and safe defaults",
            () => {
                const service = new WsResponseService({
                } as never)
                const client = {
                    emit: jest.fn(),
                }

                service.error({
                    client: client as never,
                    eventName: "error-event",
                    error: new TypeError("invalid payload"),
                })
                service.error({
                    client: client as never,
                    eventName: "unknown-event",
                    error: {
                    } as Error,
                })

                expect(client.emit).toHaveBeenNthCalledWith(1,
                    "error-event",
                    {
                        success: false,
                        message: "invalid payload",
                        error: "TypeError",
                    })
                expect(client.emit).toHaveBeenNthCalledWith(2,
                    "unknown-event",
                    {
                        success: false,
                        message: "Unknown error",
                        error: "Unknown error",
                    })
            })
    })
