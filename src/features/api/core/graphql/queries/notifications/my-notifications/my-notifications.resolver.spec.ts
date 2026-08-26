import {
    MyNotificationsResolver,
} from "./my-notifications.resolver"

describe("MyNotificationsResolver",
    () => {
        it("combines paginated notifications with unread count",
            async () => {
                const page = {
                    total: 1,
                    items: [{
                        id: "n1",
                        type: "system",
                        payload: {
                            title: {
                                key: "hello",
                            },
                            target: "/x",
                        },
                        readAt: null,
                        createdAt: new Date(0),
                    }],
                }
                const service = {
                    listNotifications: jest.fn().mockResolvedValue(page),
                    countUnread: jest.fn().mockResolvedValue(3),
                }

                const result = await new MyNotificationsResolver(service as never).execute(
                    {
                        id: "u1",
                    } as never,
                    10,
                    0,
                    false,
                    null,
                )

                expect(result).toMatchObject({
                    total: 1,
                    unreadCount: 3,
                    items: [{
                        id: "n1",
                        isRead: false,
                        title: {
                            key: "hello",
                        },
                    }],
                })
                expect(service.listNotifications).toHaveBeenCalledWith(expect.objectContaining({
                    userId: "u1",
                    unreadOnly: false,
                }))
            })

        it("passes an optional type filter and clamps hostile pagination values",
            async () => {
                const service = {
                    listNotifications: jest.fn().mockResolvedValue({
                        total: 0,
                        items: [],
                    }),
                    countUnread: jest.fn().mockResolvedValue(0),
                }

                const result = await new MyNotificationsResolver(service as never).execute(
                    {
                        id: "u1",
                    } as never,
                    500,
                    -10,
                    undefined as never,
                    "system" as never,
                )

                expect(result).toEqual(expect.objectContaining({
                    total: 0,
                    unreadCount: 0,
                    items: [],
                }))
                expect(service.listNotifications).toHaveBeenCalledWith(expect.objectContaining({
                    userId: "u1",
                    limit: 100,
                    offset: 0,
                    unreadOnly: false,
                    type: "system",
                }))
            })
    })
