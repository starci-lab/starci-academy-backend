import {
    NotificationsGateway 
} from "./notifications.gateway"

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
    })
