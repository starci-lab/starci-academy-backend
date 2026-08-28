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
            execute: jest.fn(),
        }
        const responseService = {
            successToRoom: jest.fn(),
        }
        const roomService = {
            name: jest.fn((id: string) => `room:${id}`),
        }
        const eventEmitter = {
            on: jest.fn(),
        }
        const jobStatusReadService = {
            getForPublication: jest.fn(),
        }
        const gateway = new SubcribeJobNotificationGateway(
            subscribeService as never,
            responseService as never,
            roomService as never,
            eventEmitter as never,
            jobStatusReadService as never,
        )

        beforeEach(() => jest.clearAllMocks())

        it("delegates subscription payloads and awaits the service",
            async () => {
                subscribeService.execute.mockResolvedValue(undefined)
                const client = {
                    data: {
                        userId: "user-3",
                    },
                }
                const payload = {
                    data: {
                        jobId: "job-9",
                    },
                    locale: "en",
                }

                await gateway.handleSubcribeJobNotification(
                    client as never,
                    payload as never,
                )

                expect(subscribeService.execute).toHaveBeenCalledWith({
                    payload,
                    client,
                })
            })

        it("reloads and publishes the same safe read model used by GraphQL",
            async () => {
                const status = {
                    jobId: "job-4",
                    category: null,
                    actionType: "run",
                    status: "failed",
                    currentStep: 1,
                    maxSteps: 2,
                    updatedAt: new Date(),
                    retryable: true,
                    failureReason: "The job could not be completed. You can retry the original action.",
                    result: null,
                }
                jobStatusReadService.getForPublication.mockResolvedValue(status)
                gateway.onModuleInit()
                const registration = eventEmitter.on.mock.calls[0][0] as {
                    event: EventName
                    listener: (payload: { jobId: string; status: string }) => Promise<void>
                }
                const server = {
                    to: jest.fn(),
                }
                ;(gateway as unknown as { server: unknown }).server = server

                await registration.listener({
                    jobId: "job-4",
                    status: "completed",
                })

                expect(registration.event).toBe(EventName.JobStatusUpdated)
                expect(jobStatusReadService.getForPublication).toHaveBeenCalledWith("job-4")
                expect(roomService.name).toHaveBeenCalledWith("job-4")
                expect(responseService.successToRoom).toHaveBeenCalledWith(expect.objectContaining({
                    room: "room:job-4",
                    namespace: server,
                    eventName: SubscriptionEvent.JobStatusUpdated,
                    data: {
                        ...status,
                        status: "completed",
                    },
                }))
            })

        it("does not publish when the job row disappeared",
            async () => {
                jobStatusReadService.getForPublication.mockResolvedValue(null)
                gateway.onModuleInit()
                const registration = eventEmitter.on.mock.calls[0][0] as {
                    listener: (payload: { jobId: string; status: string }) => Promise<void>
                }

                await registration.listener({
                    jobId: "missing",
                    status: "failed",
                })

                expect(responseService.successToRoom).not.toHaveBeenCalled()
            })
    })
