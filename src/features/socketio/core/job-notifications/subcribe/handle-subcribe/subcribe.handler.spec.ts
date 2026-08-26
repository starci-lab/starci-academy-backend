import {
    SubcribeJobNotificationHandler,
} from "./subcribe.handler"
import {
    SubcribeJobNotificationQuery,
} from "./subcribe.query"
import {
    SubscriptionEvent,
} from "../../../enums/subscription-event"

describe("SubcribeJobNotificationHandler",
    () => {
        const jobRoomService = {
            name: jest.fn((id: string) => `job:${id}`),
        }
        const wsResponseService = {
            success: jest.fn(),
            error: jest.fn(),
        }
        const jobActionService = {
            getJob: jest.fn(),
        }
        const handler = new SubcribeJobNotificationHandler(
        jobRoomService as never,
        wsResponseService as never,
        jobActionService as never,
        )

        beforeEach(() => {
            jest.clearAllMocks()
        })

        it("joins the owned job room and returns its status details",
            async () => {
                const client = {
                    data: {
                        userId: 42
                    },
                    join: jest.fn(),
                }
                jobActionService.getJob.mockResolvedValue({
                    id: "job-1",
                    refs: {
                        challengeSubmissionId: "submission-1"
                    },
                    category: null,
                    actionType: "run",
                    status: "completed",
                    error: null,
                })

                await handler.execute(new SubcribeJobNotificationQuery({
                    client: client as never,
                    payload: {
                        data: {
                            jobId: "job-1"
                        }, locale: "en" as never
                    },
                }))

                expect(jobActionService.getJob).toHaveBeenCalledWith({
                    id: "job-1", userId: 42
                })
                expect(jobRoomService.name).toHaveBeenCalledWith("job-1")
                expect(client.join).toHaveBeenCalledWith("job:job-1")
                expect(wsResponseService.success).toHaveBeenCalledWith(expect.objectContaining({
                    eventName: SubscriptionEvent.JobStatusUpdated,
                    data: expect.objectContaining({
                        jobId: "job-1",
                        challengeSubmissionId: "submission-1",
                        category: undefined,
                        error: undefined,
                    }),
                }))
            })

        it("emits a not-found response when the scoped lookup has no result",
            async () => {
                const client = {
                    data: {
                        userId: 7
                    },
                    join: jest.fn(),
                }
                jobActionService.getJob.mockResolvedValue(undefined)

                await handler.execute(new SubcribeJobNotificationQuery({
                    client: client as never,
                    payload: {
                        data: {
                            jobId: "missing"
                        }, locale: "en" as never
                    },
                }))

                expect(client.join).toHaveBeenCalledWith("job:missing")
                expect(wsResponseService.error).toHaveBeenCalledWith(expect.objectContaining({
                    client,
                    eventName: SubscriptionEvent.JobStatusUpdated,
                    error: expect.objectContaining({
                        message: "Job not found"
                    }),
                }))
                expect(wsResponseService.success).not.toHaveBeenCalled()
            })
    })
