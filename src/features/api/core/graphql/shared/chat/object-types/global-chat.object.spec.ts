import {
    GlobalChatCommandObject, GlobalChatMessageObject, GlobalChatReactionObject, GlobalChatRoomObject 
} from "./global-chat.object"

describe("global chat GraphQL objects",
    () => {
        it("preserves nullable moderation and room fields in runtime projections",
            () => {
                const reaction = Object.assign(new GlobalChatReactionObject(),
                    {
                        emoji: "thumbsup", count: 2, reactedByViewer: true 
                    })
                const message = Object.assign(new GlobalChatMessageObject(),
                    {
                        id: "m1", body: null, authorId: "u1", authorName: "A", authorAvatar: null, replyToId: null, version: 1, editedAt: null, removedAt: null, removalState: null, createdAt: new Date(), reactions: [reaction], mentionedViewer: false, isMine: true 
                    })
                const room = Object.assign(new GlobalChatRoomObject(),
                    {
                        conversationId: "c1", accessState: "member", canWrite: true, notificationsMuted: false, unreadCount: 0, mentionCount: 0, lastReadMessageId: null 
                    })
                const command = Object.assign(new GlobalChatCommandObject(),
                    {
                        commandId: "cmd", conversationId: room.conversationId, messageId: message.id, status: "accepted" 
                    })
                expect({
                    message, room, command 
                }).toMatchObject({
                    message: {
                        body: null, reactions: [reaction] 
                    }, room: {
                        lastReadMessageId: null 
                    }, command: {
                        messageId: "m1" 
                    } 
                })
            })
    })
