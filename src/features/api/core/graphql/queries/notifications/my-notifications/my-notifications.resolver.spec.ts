import {
    MyNotificationsResolver
} from "./my-notifications.resolver"
describe("MyNotificationsResolver",
    () => { it("combines paginated notifications with unread count",
        async () => { const page = {
            total: 1, items: [{
                id: "n1", type: "system", payload: {
                    title: {
                        key: "hello"
                    }, target: "/x"
                }, readAt: null, createdAt: new Date(0)
            }]
        }; const service = {
            listNotifications: jest.fn().mockResolvedValue(page), countUnread: jest.fn().mockResolvedValue(3)
        }; const result = await new MyNotificationsResolver(service as never).execute({
            id: "u1"
        } as never,
        10,
        0,
        false,
        null); expect(result).toMatchObject({
            total: 1, unreadCount: 3, items: [{
                id: "n1", isRead: false, title: {
                    key: "hello"
                }
            }]
        }); expect(service.listNotifications).toHaveBeenCalledWith(expect.objectContaining({
            userId: "u1", unreadOnly: false
        })) }) })
