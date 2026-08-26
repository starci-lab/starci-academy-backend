import {
    SocketioRealtimeChatGateway
} from "./socketio-realtime-chat.gateway"

describe("SocketioRealtimeChatGateway",
    () => {
        it("switches rooms and notifies peers",
            () => {
                const emit = jest.fn()
                const client = {
                    data: {
                        room: "old"
                    }, leave: jest.fn(), join: jest.fn(), to: jest.fn().mockReturnValue({
                        emit
                    })
                }
                const result = new SocketioRealtimeChatGateway().handleJoinRoom(client as never,
                    {
                        room: "new", nickname: "nick"
                    })
                expect(client.leave).toHaveBeenCalledWith("old")
                expect(result).toEqual({
                    ok: true, room: "new", nickname: "nick"
                })
                expect(emit).toHaveBeenCalledWith("roomToClient",
                    {
                        nickname: "nick", event: "join"
                    })
            })
        it("broadcasts authoritative nickname and ignores unjoined disconnects",
            () => {
                const emit = jest.fn()
                const gateway = new SocketioRealtimeChatGateway()
                Object.assign(gateway,
                    {
                        server: {
                            to: jest.fn().mockReturnValue({
                                emit
                            })
                        }
                    })
                gateway.handleChatToServer({
                    data: {
                        nickname: "alice"
                    }
                } as never,
                {
                    room: "r", text: "hello"
                })
                expect(emit).toHaveBeenCalledWith("chatToClient",
                    expect.objectContaining({
                        nickname: "alice", text: "hello", room: "r"
                    }))
                gateway.handleDisconnect({
                    data: {
                    }
                } as never)
                expect(emit).not.toHaveBeenCalledWith("roomToClient",
                    expect.anything())
            })

        it("ignores chat messages from a client that has not joined a room",
            () => {
                const emit = jest.fn()
                const gateway = new SocketioRealtimeChatGateway()
                Object.assign(gateway,
                    {
                        server: {
                            to: jest.fn().mockReturnValue({
                                emit,
                            }),
                        },
                    })

                gateway.handleChatToServer({
                    data: {
                    },
                } as never,
                {
                    room: "room",
                    text: "ignored",
                })

                expect(emit).toHaveBeenCalledWith(
                    "chatToClient",
                    expect.objectContaining({
                        nickname: "anon",
                        text: "ignored",
                        room: "room",
                    }),
                )
            })
    })
