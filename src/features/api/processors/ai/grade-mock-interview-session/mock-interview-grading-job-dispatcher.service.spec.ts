import {
    MockInterviewGradingJobDispatcherService,
} from "./mock-interview-grading-job-dispatcher.service"

describe("MockInterviewGradingJobDispatcherService",
    () => {
        it("publishes the durable grading-job id returned by PostgreSQL",
            async () => {
                const entityManager = {
                    query: jest.fn().mockResolvedValue([[{
                        id: "grading-job-1"
                    }],
                    1]),
                }
                const queue = {
                    add: jest.fn().mockResolvedValue(undefined),
                }
                const service = new MockInterviewGradingJobDispatcherService(entityManager as never,
                    queue as never)

                await service.dispatch()

                expect(entityManager.query).toHaveBeenCalledWith(expect.stringContaining("RETURNING job.id AS \"id\""),
                    [expect.any(String)])
                const leaseToken = entityManager.query.mock.calls[0][1][0] as string
                expect(queue.add).toHaveBeenCalledWith("grade",
                    {
                        gradingJobId: "grading-job-1", leaseToken
                    },
                    {
                        jobId: `grading-job-1-${leaseToken}`
                    })
                expect(queue.add).toHaveBeenCalledTimes(1)
            })

        it("releases the same lease for a bounded retry when BullMQ publication fails",
            async () => {
                const execute = jest.fn().mockResolvedValue(undefined)
                const where = jest.fn().mockReturnValue({
                    execute 
                })
                const set = jest.fn().mockReturnValue({
                    where 
                })
                const update = jest.fn().mockReturnValue({
                    set 
                })
                const entityManager = {
                    query: jest.fn().mockResolvedValue([[{
                        id: "grading-job-1"
                    }],
                    1]),
                    createQueryBuilder: jest.fn().mockReturnValue({
                        update 
                    }),
                }
                const queue = {
                    add: jest.fn().mockRejectedValue(new Error("redis unavailable")),
                }
                const service = new MockInterviewGradingJobDispatcherService(entityManager as never,
                    queue as never)

                await service.dispatch()

                expect(update).toHaveBeenCalled()
                expect(set).toHaveBeenCalledWith(expect.objectContaining({
                    status: "retry_scheduled",
                    leaseToken: null,
                    leaseExpiresAt: null,
                    lastError: "redis unavailable",
                }))
                const leaseToken = entityManager.query.mock.calls[0][1][0] as string
                expect(where).toHaveBeenCalledWith("id = :id AND lease_token = :leaseToken",
                    {
                        id: "grading-job-1", leaseToken
                    })
                expect(execute).toHaveBeenCalledTimes(1)
            })
    })
