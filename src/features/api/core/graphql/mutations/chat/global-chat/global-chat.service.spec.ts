import {
    GlobalChatMutationService,
} from "./global-chat.service"

describe("GlobalChatMutationService",
    () => {
        it("maps every mutation request into the domain command contract",
            async () => {
                const domain = {
                    sendMessage: jest.fn().mockResolvedValue("sent"),
                    toggleReaction: jest.fn().mockResolvedValue("reacted"),
                    editMessage: jest.fn().mockResolvedValue("edited"),
                    removeMessage: jest.fn().mockResolvedValue("removed"),
                    markRead: jest.fn().mockResolvedValue("read"),
                    report: jest.fn().mockResolvedValue("reported"),
                    moderate: jest.fn().mockResolvedValue("moderated"),
                    setNotificationsMuted: jest.fn().mockResolvedValue("notifications"),
                }
                const service = new GlobalChatMutationService(domain as never)
                const user = {
                    id: "user-1"
                }

                await service.send(user as never,
{
    clientCommandId: "c1", body: "hello", replyToId: "r1", mentionUserIds: ["u2"],
} as never)
                await service.react(user as never,
{
    clientCommandId: "c2", messageId: "m1", emoji: "heart",
} as never)
                await service.edit(user as never,
{
    clientCommandId: "c3", messageId: "m1", body: "updated", expectedVersion: 2,
} as never)
                await service.remove(user as never,
{
    clientCommandId: "c4", messageId: "m1", expectedVersion: 3,
} as never)
                await service.markRead(user as never,
{
    clientCommandId: "c5", messageId: "m1",
} as never)
                await service.report(user as never,
{
    clientCommandId: "c6", messageId: "m1", reportedUserId: "u2", category: "spam", details: "details",
} as never)
                await service.moderate(user as never,
{
    clientCommandId: "c7", caseId: "case-1", action: "remove", reason: "policy", expectedVersion: 1, mutedUntil: null,
} as never)
                await service.notifications(user as never,
{
    clientCommandId: "c8", muted: true,
} as never)

                expect(domain.sendMessage).toHaveBeenCalledWith(expect.objectContaining({
                    user, commandId: "c1", body: "hello", replyToId: "r1", mentionUserIds: ["u2"],
                }))
                expect(domain.toggleReaction).toHaveBeenCalledWith(expect.objectContaining({
                    messageId: "m1", emoji: "heart"
                }))
                expect(domain.editMessage).toHaveBeenCalledWith(expect.objectContaining({
                    body: "updated", expectedVersion: 2
                }))
                expect(domain.removeMessage).toHaveBeenCalledWith(expect.objectContaining({
                    expectedVersion: 3
                }))
                expect(domain.markRead).toHaveBeenCalledWith(expect.objectContaining({
                    messageId: "m1"
                }))
                expect(domain.report).toHaveBeenCalledWith(expect.objectContaining({
                    reportedUserId: "u2", category: "spam"
                }))
                expect(domain.moderate).toHaveBeenCalledWith(expect.objectContaining({
                    caseId: "case-1", mutedUntil: null
                }))
                expect(domain.setNotificationsMuted).toHaveBeenCalledWith(expect.objectContaining({
                    muted: true
                }))
            })

        it("returns the room conversation and requested role after setRole",
            async () => {
                const domain = {
                    roomState: jest.fn().mockResolvedValue({
                        conversationId: "room-1"
                    }),
                    setRole: jest.fn().mockResolvedValue(undefined),
                }
                const service = new GlobalChatMutationService(domain as never)
                const user = {
                    id: "admin-1"
                }
                const request = {
                    clientCommandId: "role-1", targetUserId: "user-2", role: "moderator",
                }

                await expect(service.setRole(user as never,
request as never)).resolves.toEqual({
                    commandId: "role-1",
                    conversationId: "room-1",
                    status: "moderator",
                })
                expect(domain.setRole).toHaveBeenCalledWith({
                    actor: user,
                    targetUserId: "user-2",
                    role: "moderator",
                })
            })
    })
