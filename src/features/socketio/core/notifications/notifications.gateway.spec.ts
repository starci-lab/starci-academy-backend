import {
    NotificationsGateway
} from "./notifications.gateway"
import {
    EventName,
} from "@modules/platform/event/enums/event-name"

describe("NotificationsGateway",
    () => {
        it("rejects unauthenticated subscriptions and joins the resolved user room",
            async () => {
                const response = {
                    error: jest.fn(), successToRoom: jest.fn()
                }
                const users = {
                    getUserByKeycloakId: jest.fn().mockResolvedValue({
                        id: "u1"
                    })
                }
                const rooms = {
                    name: jest.fn((id) => `notifications:${id}`)
                }
                const gateway = new NotificationsGateway(users as never,
rooms as never,
response as never,
{
    on: jest.fn()
} as never,
{
    log: jest.fn()
} as never)
                await gateway.handleSubscribeNotifications({
                    data: {
                    }, id: "s1"
                } as never)
                expect(response.error).toHaveBeenCalled()
                const client = {
                    data: {
                        userId: "kc1"
                    }, join: jest.fn()
                }
                await gateway.handleSubscribeNotifications(client as never)
                expect(client.join).toHaveBeenCalledWith("notifications:u1")
            })

        it("reports lookup failures without joining a notification room",
            async () => {
                const response = {
                    error: jest.fn(),
                    successToRoom: jest.fn(),
                }
                const gateway = new NotificationsGateway(
                    {
                        getUserByKeycloakId: jest.fn().mockRejectedValue("user lookup failed"),
                    } as never,
                    {
                        name: jest.fn(),
                    } as never,
                    response as never,
                    {
                        on: jest.fn(),
                    } as never,
                    {
                        log: jest.fn(),
                    } as never,
                )
                const client = {
                    id: "socket-failure",
                    data: {
                        userId: "kc-missing",
                    },
                    join: jest.fn(),
                }

                await gateway.handleSubscribeNotifications(client as never)

                expect(response.error).toHaveBeenCalled()
                expect(client.join).not.toHaveBeenCalled()
            })

        it("installs auth middleware and forwards created notifications to the recipient room",
            () => {
                const response = {
                    error: jest.fn(),
                    successToRoom: jest.fn(),
                }
                const on = jest.fn()
                const gateway = new NotificationsGateway(
                    {
                        getUserByKeycloakId: jest.fn(),
                    } as never,
                    {
                        name: jest.fn((id: string) => `notifications:${id}`),
                    } as never,
                    response as never,
                    {
                        on,
                    } as never,
                    {
                        log: jest.fn(),
                    } as never,
                )
                const middleware = jest.fn()
                Object.assign(gateway,
                    {
                        server: {
                            use: middleware,
                        },
                    })

                gateway.afterInit()
                gateway.onModuleInit()

                expect(middleware).toHaveBeenCalled()
                expect(on).toHaveBeenCalledWith(expect.objectContaining({
                    event: EventName.NotificationCreated,
                    listener: expect.any(Function),
                }))
                const listener = on.mock.calls[0][0].listener as (payload: {
                    userId: string
                    notification: {
                        id: string
                    }
                }) => void
                listener({
                    userId: "u1",
                    notification: {
                        id: "n1",
                    },
                })

                expect(response.successToRoom).toHaveBeenCalledWith(expect.objectContaining({
                    room: "notifications:u1",
                    data: {
                        notification: {
                            id: "n1",
                        },
                    },
                }))
            })

        it("does not emit a success response when joining the room fails",
            async () => {
                const response = {
                    error: jest.fn(),
                    successToRoom: jest.fn(),
                }
                const gateway = new NotificationsGateway({
                    getUserByKeycloakId: jest.fn().mockResolvedValue({
                        id: "u1"
                    }),
                } as never,
{
    name: jest.fn().mockReturnValue("notifications:u1"),
} as never,
response as never,
{
    on: jest.fn()
} as never,
                {
                    log: jest.fn()
                } as never)
                const join = jest.fn().mockRejectedValue(new Error("room unavailable"))

                await expect(gateway.handleSubscribeNotifications({
                    id: "socket-1",
                    data: {
                        userId: "kc1"
                    },
                    join,
                } as never)).resolves.toBeUndefined()
                expect(response.successToRoom).not.toHaveBeenCalled()
            })
    })
