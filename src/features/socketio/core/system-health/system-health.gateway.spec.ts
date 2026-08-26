import {
    SystemHealthGateway
} from "./system-health.gateway"
import {
    EventName
} from "@modules/platform/event/enums/event-name"
import {
    SubscriptionEvent
} from "../enums/subscription-event"

describe("SystemHealthGateway",
    () => {
        it("registers an event listener that broadcasts model health",
            () => {
                const on = jest.fn()
                const broadcast = jest.fn()
                const gateway = new SystemHealthGateway({
                    broadcast
                } as never,
{
    on
} as never)
                gateway.onModuleInit()
                expect(on).toHaveBeenCalledWith(expect.objectContaining({
                    event: EventName.AiModelHealthUpdated
                }))
                const registration = on.mock.calls[0][0] as { listener: (payload: { models: unknown[] }) => void }
                registration.listener({
                    models: [{
                        name: "model", healthy: true
                    }]
                })
                expect(broadcast).toHaveBeenCalledWith(expect.objectContaining({
                    eventName: SubscriptionEvent.AiModelHealth,
                    data: {
                        models: [{
                            name: "model", healthy: true
                        }]
                    },
                }))
            })
    })
