import {
    ContentDiscussionGateway 
} from "./content-discussion.gateway"
import {
    EventName 
} from "@modules/platform/event/enums/event-name"

describe("ContentDiscussionGateway",
    () => {
        it("joins a content room and forwards comment events with parent ids",
            () => {
                const room = {
                    name: jest.fn((id) => `content:${id}`) 
                }
                const response = {
                    successToRoom: jest.fn() 
                }
                const listeners = new Map<string, (payload: unknown) => void>()
                const gateway = new ContentDiscussionGateway(room as never,
response as never,
{
    on: jest.fn(({ event, listener }) => listeners.set(event,
        listener)) 
} as never)
                const client = {
                    join: jest.fn() 
                }
                gateway.handleSubscribeContentDiscussion(client as never,
{
    data: {
        contentId: "c1" 
    } 
} as never)
                expect(client.join).toHaveBeenCalledWith("content:c1")
                gateway.onModuleInit()
                listeners.get(EventName.CommentCreated)?.({
                    contentId: "c1", commentId: "m1", parentCommentId: null 
                })
                expect(response.successToRoom).toHaveBeenCalledWith(expect.objectContaining({
                    room: "content:c1", data: {
                        contentId: "c1", commentId: "m1", parentCommentId: null 
                    } 
                }))
            })
    })
