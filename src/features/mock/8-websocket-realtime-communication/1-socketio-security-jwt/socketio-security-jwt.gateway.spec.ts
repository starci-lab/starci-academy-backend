import {
    SocketioSecurityJwtGateway
} from "./socketio-security-jwt.gateway"

describe("SocketioSecurityJwtGateway",
    () => {
        it("rejects missing and invalid handshake tokens",
            () => {
                const jwt = {
                    verify: jest.fn().mockImplementation(() => { throw new Error("bad") })
                }
                const gateway = new SocketioSecurityJwtGateway(jwt as never)
                const use = jest.fn()
                gateway.afterInit({
                    use
                } as never)
                const middleware = use.mock.calls[0][0] as (socket: unknown, next: (error?: Error) => void) => void
                const socket: { handshake: { auth: { token?: string }; headers: Record<string, string>; query: Record<string, string> }; data: Record<string, unknown> } = {
                    handshake: {
                        auth: {
                        }, headers: {
                        }, query: {
                        }
                    }, data: {
                    }
                }
                const next = jest.fn()
                middleware(socket,
                    next)
                expect(next.mock.calls[0][0]).toEqual(new Error("Unauthorized: missing token"))
                socket.handshake.auth.token = "bad"
                middleware(socket,
                    next)
                expect(next.mock.calls[1][0]).toEqual(new Error("Unauthorized: invalid token"))
            })
        it("derives chat identity from the verified token and joins rooms",
            () => {
                const gateway = new SocketioSecurityJwtGateway({
                    verify: jest.fn().mockReturnValue({
                        sub: "u", username: "alice"
                    })
                } as never)
                const server = {
                    use: jest.fn()
                }
                gateway.afterInit(server as never)
                const socket = {
                    handshake: {
                        auth: {
                            token: "ok"
                        }, headers: {
                        }, query: {
                        }
                    }, data: {
                    }
                }
                const next = jest.fn()
                server.use.mock.calls[0][0](socket,
                    next)
                expect(next).toHaveBeenCalledWith()
                const client = {
                    data: socket.data, join: jest.fn()
                }
                expect(gateway.handleJoinRoom(client as never,
                    {
                        room: "room"
                    })).toEqual(expect.objectContaining({
                    data: {
                        room: "room", message: "You joined room room"
                    }
                }))
                expect(client.join).toHaveBeenCalledWith("room")
            })

        it("accepts bearer-header and query-token handshake fallbacks",
            () => {
                const jwt = {
                    verify: jest.fn().mockReturnValue({
                        sub: "u",
                        username: "alice",
                    }),
                }
                const gateway = new SocketioSecurityJwtGateway(jwt as never)
                const use = jest.fn()
                gateway.afterInit({
                    use,
                } as never)
                const middleware = use.mock.calls[0][0] as (socket: unknown, next: (error?: Error) => void) => void
                const next = jest.fn()

                middleware({
                    handshake: {
                        auth: {
                        },
                        headers: {
                            authorization: "Bearer header-token",
                        },
                        query: {
                        },
                    },
                    data: {
                    },
                },
                next)
                middleware({
                    handshake: {
                        auth: {
                        },
                        headers: {
                        },
                        query: {
                            token: "query-token",
                        },
                    },
                    data: {
                    },
                },
                next)

                expect(jwt.verify).toHaveBeenNthCalledWith(1,
                    "header-token")
                expect(jwt.verify).toHaveBeenNthCalledWith(2,
                    "query-token")
                expect(next).toHaveBeenCalledWith()
            })

        it("does not broadcast messages from a socket without verified identity",
            () => {
                const gateway = new SocketioSecurityJwtGateway({
                    verify: jest.fn(),
                } as never)
                const emit = jest.fn()
                Object.defineProperty(gateway,
                    "server",
                    {
                        value: {
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
                    text: "hello",
                    room: "room",
                } as never)

                expect(emit).not.toHaveBeenCalled()
            })

        it("broadcasts with the JWT username instead of client-supplied identity",
            () => {
                const gateway = new SocketioSecurityJwtGateway({
                    verify: jest.fn(),
                } as never)
                const emit = jest.fn()
                Object.defineProperty(gateway,
                    "server",
                    {
                        value: {
                            to: jest.fn().mockReturnValue({
                                emit,
                            }),
                        },
                    })

                gateway.handleChatToServer({
                    data: {
                        user: {
                            username: "verified-user",
                        },
                    },
                } as never,
                {
                    text: "hello",
                    room: "room",
                    username: "spoofed-user",
                } as never)

                expect(emit).toHaveBeenCalledWith(
                    "chatToClient",
                    expect.objectContaining({
                        text: "hello",
                        room: "room",
                        username: "verified-user",
                    }),
                )
            })
    })
