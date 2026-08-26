import {
    ReconnectionGateway
} from "./reconnection.gateway"

describe("ReconnectionGateway",
    () => {
        it("joins and replays missed messages",
            () => {
                const store = {
                    lastSeq: jest.fn().mockReturnValue(3), replaySince: jest.fn().mockReturnValue([{
                        seq: 2
                    }])
                }
                const gateway = new ReconnectionGateway(store as never)
                const client = {
                    data: {
                    }, join: jest.fn()
                }
                expect(gateway.handleJoin(client as never,
                    {
                        roomId: "r", userId: "u"
                    })).toEqual({
                    ok: true, lastSeq: 3
                })
                expect(gateway.handleReplaySince({
                    roomId: "r", lastSeq: 1
                })).toEqual({
                    messages: [{
                        seq: 2
                    }]
                })
            })
        it("attributes and broadcasts chat messages",
            () => {
                const emit = jest.fn()
                const message = {
                    seq: 4, text: "hi"
                }
                const store = {
                    append: jest.fn().mockReturnValue(message)
                }
                const gateway = new ReconnectionGateway(store as never)
                Object.assign(gateway,
                    {
                        server: {
                            to: jest.fn().mockReturnValue({
                                emit
                            })
                        }
                    })
                expect(gateway.handleChat({
                    data: {
                        userId: "u"
                    }
                } as never,
                {
                    roomId: "r", text: "hi"
                })).toEqual({
                    ok: true, seq: 4
                })
                expect(store.append).toHaveBeenCalledWith("r",
                    "u",
                    "hi")
                expect(emit).toHaveBeenCalledWith("chat",
                    message)
            })
    })
