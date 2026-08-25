import {
    CommunityFeedGateway 
} from "./community-feed.gateway"
import {
    EventName 
} from "@modules/platform/event/enums/event-name"

describe("CommunityFeedGateway",
    () => {
        it("joins requested rooms and forwards post events to channel and all rooms",
            () => {
                const room = {
                    postRoom: jest.fn((id) => `post:${id}`), channelRoom: jest.fn((id) => `channel:${id}`), allRoom: jest.fn(() => "all") 
                }
                const response = {
                    successToRoom: jest.fn() 
                }
                const listeners = new Map<string, (payload: unknown) => void>()
                const gateway = new CommunityFeedGateway(room as never,
response as never,
{
    on: jest.fn(({ event, listener }) => listeners.set(event,
        listener)) 
} as never)
                const client = {
                    join: jest.fn() 
                }
                gateway.handleSubscribeCommunityFeed(client as never,
{
    data: {
        postId: "p1", channel: "general" 
    } 
} as never)
                expect(client.join).toHaveBeenCalledWith("post:p1")
                expect(client.join).toHaveBeenCalledWith("channel:general")
                gateway.onModuleInit()
                listeners.get(EventName.CommunityPostCreated)?.({
                    postId: "p1", channel: "general" 
                })
                expect(response.successToRoom).toHaveBeenCalledTimes(2)
            })
    })
