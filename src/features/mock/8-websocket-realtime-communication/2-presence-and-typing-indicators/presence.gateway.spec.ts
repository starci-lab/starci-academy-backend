import {
    PresenceGateway
} from "./presence.gateway"

describe("PresenceGateway",
    () => {
        it("announces first joins and returns the roster",
            () => {
                const store = {
                    addTab: jest.fn().mockReturnValue({
                        isFirstTab: true
                    }), members: jest.fn().mockReturnValue(["u"])
                }
                const client = {
                    id: "socket", data: {
                    }, join: jest.fn(), to: jest.fn().mockReturnValue({
                        emit: jest.fn()
                    })
                }
                const result = new PresenceGateway(store as never).handleJoin(client as never,
                    {
                        roomId: "room", userId: "u"
                    })
                expect(result).toEqual({
                    ok: true, online: ["u"]
                })
                expect(client.to).toHaveBeenCalledWith("room")
            })
        it("relays typing and announces final-tab disconnect",
            () => {
                const emit = jest.fn()
                const server = {
                    to: jest.fn().mockReturnValue({
                        emit
                    })
                }
                const gateway = new PresenceGateway({
                    removeTab: jest.fn().mockReturnValue({
                        isLastTab: true
                    })
                } as never)
                Object.assign(gateway,
                    {
                        server
                    })
                const client = {
                    id: "socket", data: {
                        roomId: "room", userId: "u"
                    }, to: jest.fn().mockReturnValue({
                        emit
                    })
                }
                gateway.handleTyping(client as never,
                    {
                        roomId: "room", userId: "u"
                    })
                gateway.handleDisconnect(client as never)
                expect(emit).toHaveBeenCalledWith("typing",
                    {
                        userId: "u"
                    })
                expect(emit).toHaveBeenCalledWith("user-left",
                    {
                        userId: "u"
                    })
            })

        it("does not announce a user whose tab was not the first one",
            () => {
                const emit = jest.fn()
                const client = {
                    id: "socket-2",
                    data: {
                    },
                    join: jest.fn(),
                    to: jest.fn().mockReturnValue({
                        emit,
                    }),
                }
                const result = new PresenceGateway({
                    addTab: jest.fn().mockReturnValue({
                        isFirstTab: false,
                    }),
                    members: jest.fn().mockReturnValue(["u"]),
                } as never).handleJoin(client as never,
                    {
                        roomId: "room",
                        userId: "u",
                    })

                expect(result).toEqual({
                    ok: true,
                    online: ["u"],
                })
                expect(emit).not.toHaveBeenCalledWith("user-joined",
                    expect.anything())
            })
    })
