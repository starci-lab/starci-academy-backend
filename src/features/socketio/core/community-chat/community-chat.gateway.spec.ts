import {
    CommunityChatGateway 
} from "./community-chat.gateway"

describe("CommunityChatGateway",
    () => {
        it("authorizes and joins a room, but never joins when authorization fails",
            async () => {
                const room = {
                    name: jest.fn((id) => `chat:${id}`) 
                }
                const response = {
                    success: jest.fn(), error: jest.fn() 
                }
                const chat = {
                    assertCanSubscribe: jest.fn().mockResolvedValue(undefined) 
                }
                const gateway = new CommunityChatGateway(room as never,
chat as never,
response as never,
{
    on: jest.fn() 
} as never)
                const client = {
                    data: {
                        userId: "kc1" 
                    }, join: jest.fn() 
                }
                await gateway.handleSubscribeCommunityChat(client as never,
{
    data: {
        conversationId: "c1" 
    } 
} as never)
                expect(client.join).toHaveBeenCalledWith("chat:c1")
                chat.assertCanSubscribe.mockRejectedValue(new Error("denied"))
                const denied = {
                    data: {
                        userId: "kc1" 
                    }, join: jest.fn() 
                }
                await gateway.handleSubscribeCommunityChat(denied as never,
{
    data: {
        conversationId: "c2" 
    } 
} as never)
                expect(denied.join).not.toHaveBeenCalled()
                expect(response.error).toHaveBeenCalled()
            })
    })
