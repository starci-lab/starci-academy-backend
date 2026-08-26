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

        it("joins the global room and forwards comment and reaction event variants",
            () => {
                const room = {
                    postRoom: jest.fn((id: string) => `post:${id}`),
                    channelRoom: jest.fn((id: string) => `channel:${id}`),
                    allRoom: jest.fn(() => "all"),
                }
                const response = {
                    successToRoom: jest.fn(),
                }
                const listeners = new Map<string, (payload: unknown) => void>()
                const gateway = new CommunityFeedGateway(room as never,
                    response as never,
                    {
                        on: jest.fn(({ event, listener }) => listeners.set(event,
                            listener)),
                    } as never)
                const client = {
                    join: jest.fn(),
                }

                gateway.handleSubscribeCommunityFeed(client as never,
                    {
                        data: {
                        },
                    } as never)
                expect(client.join).toHaveBeenCalledWith("all")

                gateway.onModuleInit()
                const post = {
                    postId: "p1",
                    channel: "general",
                }
                listeners.get(EventName.CommunityPostUpdated)?.(post)
                listeners.get(EventName.CommunityPostDeleted)?.(post)
                listeners.get(EventName.CommunityCommentCreated)?.({
                    postId: "p1",
                    commentId: "c1",
                    parentCommentId: null,
                })
                listeners.get(EventName.CommunityCommentUpdated)?.({
                    postId: "p1",
                    commentId: "c1",
                    parentCommentId: "parent-1",
                })
                listeners.get(EventName.CommunityCommentDeleted)?.({
                    postId: "p1",
                    commentId: "c1",
                    parentCommentId: null,
                })
                listeners.get(EventName.CommunityPostReactionChanged)?.({
                    postId: "p1",
                })
                listeners.get(EventName.CommunityCommentReactionChanged)?.({
                    postId: "p1",
                    commentId: "c1",
                })

                expect(response.successToRoom).toHaveBeenCalledTimes(4 + 3 + 1 + 1)
                expect(response.successToRoom).toHaveBeenCalledWith(expect.objectContaining({
                    room: "post:p1",
                    data: {
                        postId: "p1",
                        commentId: "c1",
                        parentCommentId: "parent-1",
                    },
                }))
            })
    })
