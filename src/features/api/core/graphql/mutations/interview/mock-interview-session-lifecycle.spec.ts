import {
    MockInterviewSessionConflictException,
} from "@modules/platform/exceptions/errors/ai/mock-interview-session-conflict"
import {
    AbandonMockInterviewSessionService,
} from "./abandon-mock-interview-session"
import {
    CompleteMockInterviewSessionService,
} from "./complete-mock-interview-session"
import {
    RetryMockInterviewSessionGradingService,
} from "./retry-mock-interview-session-grading"

/** Fluent query-builder mock used by lifecycle state transitions. */
const queryBuilder = (result: unknown, affected = 1) => ({
    innerJoin: jest.fn().mockReturnThis(),
    setLock: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValue(result),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue({
        affected
    }),
})

describe("mock-interview durable lifecycle",
    () => {
        it("completes and creates the grading job in one transaction",
            async () => {
                const session = {
                    id: "session-1",
                    status: "in_progress",
                    revision: 3,
                }
                const query = queryBuilder(session)
                const manager = {
                    createQueryBuilder: jest.fn(() => query),
                    save: jest.fn(async (target: unknown, value?: Record<string, unknown>) => {
                        if (Array.isArray(target)) {
                            return target
                        }
                        return value ? {
                            id: "job-1", ...value
                        } : target
                    }),
                    create: jest.fn((_target: unknown, value: Record<string, unknown>) => value),
                }
                const entityManager = {
                    transaction: jest.fn(async (callback: (value: unknown) => Promise<unknown>) => callback(manager)),
                }
                const service = new CompleteMockInterviewSessionService(entityManager as never)

                await expect(service.execute({
                    courseId: "course-1",
                    sessionId: "session-1",
                    expectedRevision: 3,
                },
                "user-1")).resolves.toEqual({
                    sessionId: "session-1",
                    gradingJobId: "job-1",
                    status: "grading",
                    revision: 4,
                })
                expect(entityManager.transaction).toHaveBeenCalledTimes(1)
                expect(session).toMatchObject({
                    status: "grading", revision: 4
                })
            })

        it("rejects completion with a stale revision",
            async () => {
                const manager = {
                    createQueryBuilder: jest.fn(() => queryBuilder({
                        id: "session-1",
                        status: "in_progress",
                        revision: 4,
                    })),
                }
                const service = new CompleteMockInterviewSessionService({
                    transaction: jest.fn(async (callback: (value: unknown) => Promise<unknown>) => callback(manager)),
                } as never)

                await expect(service.execute({
                    courseId: "course-1",
                    sessionId: "session-1",
                    expectedRevision: 3,
                },
                "user-1")).rejects.toBeInstanceOf(MockInterviewSessionConflictException)
            })

        it("abandons only when the optimistic update affects one row",
            async () => {
                const query = queryBuilder(null,
                    1)
                const service = new AbandonMockInterviewSessionService({
                    createQueryBuilder: jest.fn(() => query),
                } as never)

                await expect(service.execute({
                    courseId: "course-1",
                    sessionId: "session-1",
                    expectedRevision: 6,
                },
                "user-1")).resolves.toEqual({
                    sessionId: "session-1",
                    status: "abandoned",
                    revision: 7,
                })
            })

        it("requeues a bounded failed grading job",
            async () => {
                const session = {
                    id: "session-1", status: "grading_failed", revision: 8
                }
                const gradingJob = {
                    id: "job-1",
                    attemptCount: 1,
                    maxAttempts: 3,
                    status: "failed",
                }
                const manager = {
                    createQueryBuilder: jest.fn(() => queryBuilder(session)),
                    findOne: jest.fn().mockResolvedValue(gradingJob),
                    save: jest.fn(async (value: unknown) => value),
                }
                const service = new RetryMockInterviewSessionGradingService({
                    transaction: jest.fn(async (callback: (value: unknown) => Promise<unknown>) => callback(manager)),
                } as never)

                await expect(service.execute({
                    courseId: "course-1",
                    sessionId: "session-1",
                    expectedRevision: 8,
                },
                "user-1")).resolves.toMatchObject({
                    gradingJobId: "job-1",
                    status: "grading",
                    revision: 9,
                })
                expect(gradingJob).toMatchObject({
                    status: "queued", leaseToken: null, lastError: null
                })
            })
    })
