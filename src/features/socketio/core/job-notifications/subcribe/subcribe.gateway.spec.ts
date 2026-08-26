import {
    EventName,
} from "@modules/platform/event/enums/event-name"
import {
    SubscriptionEvent,
} from "../../enums/subscription-event"
import {
    SubcribeJobNotificationGateway,
} from "./subcribe.gateway"

describe("SubcribeJobNotificationGateway",
    () => {
        const subscribeService = {
            execute: jest.fn()
        }
        const responseService = {
            successToRoom: jest.fn()
        }
        const roomService = {
            name: jest.fn((id: string) => `room:${id}`)
        }
        const eventEmitter = {
            on: jest.fn()
        }
        const gateway = new SubcribeJobNotificationGateway(
        subscribeService as never,
        responseService as never,
        roomService as never,
        eventEmitter as never,
        )

        beforeEach(() => jest.clearAllMocks())

        it("delegates subscription payloads and awaits the service",
            async () => {
                subscribeService.execute.mockResolvedValue(undefined)
                const client = {
                    data: {
                        userId: 3
                    }
                }
                const payload = {
                    data: {
                        jobId: "job-9"
                    }, locale: "en"
                }

                await gateway.handleSubcribeJobNotification(client as never,
payload as never)

                expect(subscribeService.execute).toHaveBeenCalledWith({
                    payload, client
                })
            })

        it("registers a status listener that publishes the room message",
            () => {
                gateway.onModuleInit()
                const registration = eventEmitter.on.mock.calls[0][0] as {
            event: EventName
            listener: (payload: {
                jobId: string
                challengeSubmissionId?: string
                category?: string | null
                status: string
                error?: string | null
            }) => void
        }
                const server = {
                    to: jest.fn()
                }
        ;(gateway as unknown as { server: unknown }).server = server
                registration.listener({
                    jobId: "job-4",
                    challengeSubmissionId: "sub-4",
                    category: null,
                    status: "failed",
                    error: "compile error",
                })

                expect(registration.event).toBe(EventName.JobStatusUpdated)
                expect(roomService.name).toHaveBeenCalledWith("job-4")
                expect(responseService.successToRoom).toHaveBeenCalledWith(expect.objectContaining({
                    room: "room:job-4",
                    namespace: server,
                    eventName: SubscriptionEvent.JobStatusUpdated,
                    data: expect.objectContaining({
                        category: undefined, error: "compile error"
                    }),
                }))
            })
    })
