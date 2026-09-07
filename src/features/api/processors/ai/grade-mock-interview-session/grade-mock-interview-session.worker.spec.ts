import {
    GradeMockInterviewSessionWorker,
} from "./grade-mock-interview-session.worker"
import {
    MockInterviewGradingJobDispatcherService,
} from "./mock-interview-grading-job-dispatcher.service"

/** Fluent update query used by worker claims and failure transitions. */
const updateQuery = (affected = 1) => ({
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue({
        affected
    }),
})

describe("durable mock-interview grading transport",
    () => {
        it("grades only after claiming the matching lease token",
            async () => {
                const query = updateQuery()
                const gradingJob = {
                    id: "job-1",
                    sessionId: "session-1",
                    selectedModel: null,
                    selectedModelProvider: null,
                    attemptCount: 1,
                    maxAttempts: 3,
                }
                const session = {
                    id: "session-1",
                    locale: "vi",
                    promptId: "prompt-1",
                    promptTitle: "Prompt",
                    level: "middle",
                    turns: [],
                    enrollment: {
                        user: {
                            id: "user-1"
                        },
                        course: {
                            id: "course-1"
                        },
                    },
                }
                const entityManager = {
                    createQueryBuilder: jest.fn(() => query),
                    findOneOrFail: jest.fn()
                        .mockResolvedValueOnce(gradingJob)
                        .mockResolvedValueOnce(session),
                }
                const gradingService = {
                    grade: jest.fn().mockResolvedValue({
                    })
                }
                const worker = new GradeMockInterviewSessionWorker(entityManager as never,
gradingService as never)

                await worker.process({
                    data: {
                        gradingJobId: "job-1", leaseToken: "lease-1"
                    },
                } as never)

                expect(gradingService.grade).toHaveBeenCalledWith(expect.objectContaining({
                    userId: "user-1",
                    courseId: "course-1",
                    sessionId: "session-1",
                    locale: "vi",
                }))
            })

        it("persists terminal job and session failure after the retry budget is exhausted",
            async () => {
                const managerQuery = updateQuery()
                const manager = {
                    update: jest.fn().mockResolvedValue({
                        affected: 1
                    }),
                    createQueryBuilder: jest.fn(() => managerQuery),
                }
                const entityManager = {
                    createQueryBuilder: jest.fn(() => updateQuery()),
                    findOneOrFail: jest.fn()
                        .mockResolvedValueOnce({
                            id: "job-1",
                            sessionId: "session-1",
                            selectedModel: null,
                            selectedModelProvider: null,
                            attemptCount: 3,
                            maxAttempts: 3,
                        })
                        .mockResolvedValueOnce({
                            id: "session-1",
                            promptId: "prompt-1",
                            promptTitle: "Prompt",
                            level: "middle",
                            turns: [],
                            enrollment: {
                                user: {
                                    id: "user-1"
                                }, course: {
                                    id: "course-1"
                                }
                            },
                        }),
                    transaction: jest.fn(async (callback: (value: unknown) => Promise<unknown>) => callback(manager)),
                }
                const worker = new GradeMockInterviewSessionWorker(entityManager as never,
{
    grade: jest.fn().mockRejectedValue(new Error("provider failed")),
} as never)

                await expect(worker.process({
                    data: {
                        gradingJobId: "job-1", leaseToken: "lease-1"
                    },
                } as never)).rejects.toThrow("provider failed")
                expect(manager.update).toHaveBeenCalledWith(expect.anything(),
                    {
                        id: "job-1"
                    },
                    expect.objectContaining({
                        status: "failed", lastError: "provider failed"
                    }))
                expect(managerQuery.set).toHaveBeenCalledWith(expect.objectContaining({
                    status: "grading_failed"
                }))
            })

        it("leases PostgreSQL jobs before publishing pointer-only transport messages",
            async () => {
                const entityManager = {
                    query: jest.fn().mockResolvedValue([
                        [
                            {
                                id: "job-1"
                            },
                        ],
                        1,
                    ]),
                }
                const queue = {
                    add: jest.fn().mockResolvedValue(undefined)
                }
                const dispatcher = new MockInterviewGradingJobDispatcherService(entityManager as never,
queue as never)

                await dispatcher.dispatch()

                expect(entityManager.query).toHaveBeenCalledWith(expect.stringContaining("FOR UPDATE SKIP LOCKED"),
                    [expect.any(String)])
                expect(queue.add).toHaveBeenCalledWith("grade",
                    expect.objectContaining({
                        gradingJobId: "job-1", leaseToken: expect.any(String)
                    }),
                    expect.objectContaining({
                        jobId: expect.any(String)
                    }))
            })
    })
