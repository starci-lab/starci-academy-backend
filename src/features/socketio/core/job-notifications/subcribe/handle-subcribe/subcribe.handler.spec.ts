import {
    SubscriptionEvent,
} from "../../../enums/subscription-event"
import {
    SubcribeJobNotificationHandler,
} from "./subcribe.handler"
import {
    SubcribeJobNotificationQuery,
} from "./subcribe.query"

describe("SubcribeJobNotificationHandler",
    () => {
        const jobRoomService = {
            name: jest.fn((id: string) => `job:${id}`),
        }
        const wsResponseService = {
            success: jest.fn(),
        }
        const jobStatusReadService = {
            getOwned: jest.fn(),
        }
        const userService = {
            getUserByKeycloakId: jest.fn(),
        }
        const handler = new SubcribeJobNotificationHandler(
            jobRoomService as never,
            wsResponseService as never,
            jobStatusReadService as never,
            userService as never,
        )

        beforeEach(() => {
            jest.clearAllMocks()
        })

        it("authorizes ownership before joining and returns the safe status",
            async () => {
                userService.getUserByKeycloakId.mockResolvedValue({
                    id: "user-1",
                })
                const client = {
                    data: {
                        userId: "keycloak-1",
                    },
                    join: jest.fn(),
                }
                const status = {
                    jobId: "job-1",
                    category: null,
                    actionType: "run",
                    status: "completed",
                    currentStep: 2,
                    maxSteps: 2,
                    updatedAt: new Date(),
                    retryable: false,
                    failureReason: null,
                    result: {
                        kind: "challenge-submission-attempt",
                        id: "attempt-1",
                    },
                }
                jobStatusReadService.getOwned.mockResolvedValue(status)

                await handler.execute(new SubcribeJobNotificationQuery({
                    client: client as never,
                    payload: {
                        data: {
                            jobId: "job-1",
                        },
                        locale: "en" as never,
                    },
                }))

                expect(jobStatusReadService.getOwned).toHaveBeenCalledWith({
                    jobId: "job-1",
                    userId: "user-1",
                })
                expect(userService.getUserByKeycloakId).toHaveBeenCalledWith("keycloak-1")
                expect(client.join).toHaveBeenCalledWith("job:job-1")
                expect(wsResponseService.success).toHaveBeenCalledWith(expect.objectContaining({
                    eventName: SubscriptionEvent.JobStatusUpdated,
                    data: status,
                }))
            })

        it("does not join or reveal whether an absent or foreign job exists",
            async () => {
                userService.getUserByKeycloakId.mockResolvedValue({
                    id: "user-2",
                })
                const client = {
                    data: {
                        userId: "keycloak-2",
                    },
                    join: jest.fn(),
                }
                jobStatusReadService.getOwned.mockResolvedValue(null)

                await handler.execute(new SubcribeJobNotificationQuery({
                    client: client as never,
                    payload: {
                        data: {
                            jobId: "foreign-job",
                        },
                        locale: "en" as never,
                    },
                }))

                expect(client.join).not.toHaveBeenCalled()
                expect(wsResponseService.success).not.toHaveBeenCalled()
            })
    })
