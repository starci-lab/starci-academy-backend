import type {
    EntityManager,
} from "typeorm"
import {
    JobEntity,
} from "@modules/databases/postgresql/primary/entities/job.entity"
import {
    ActionType,
} from "@modules/databases/postgresql/primary/enums/action-type"
import {
    JobCategory,
} from "@modules/databases/postgresql/primary/enums/job-category"
import {
    JobStatus,
} from "@modules/databases/postgresql/primary/enums/job-status"
import {
    JobStatusReadService,
} from "./job-status-read.service"

const buildJob = (overrides: Partial<JobEntity> = {
}): JobEntity => ({
    id: "job-1",
    userId: "user-1",
    refs: {
    },
    status: JobStatus.Queued,
    actionType: ActionType.ReviewPersonalProjectTask,
    category: JobCategory.ReviewTask,
    currentStep: 0,
    maxSteps: 2,
    updatedAt: new Date("2026-08-27T00:00:00.000Z"),
    ...overrides,
} as JobEntity)

describe("JobStatusReadService",
    () => {
        it("queries by both job id and authenticated owner",
            async () => {
                const findOne = jest.fn().mockResolvedValue(buildJob())
                const service = new JobStatusReadService({
                    findOne,
                } as unknown as EntityManager)

                const result = await service.getOwned({
                    jobId: "job-1",
                    userId: "user-1",
                })

                expect(findOne).toHaveBeenCalledWith(
                    JobEntity,
                    expect.objectContaining({
                        where: {
                            id: "job-1",
                            userId: "user-1",
                        },
                    }),
                )
                expect(result?.status).toBe(JobStatus.Queued)
            })

        it("never exposes the raw worker error",
            async () => {
                const findOne = jest.fn().mockResolvedValue(buildJob({
                    status: JobStatus.Failed,
                    error: "postgres://secret@internal/db stack trace",
                }))
                const service = new JobStatusReadService({
                    findOne,
                } as unknown as EntityManager)

                const result = await service.getOwned({
                    jobId: "job-1",
                    userId: "user-1",
                })

                expect(result?.retryable).toBe(true)
                expect(result?.failureReason).not.toContain("postgres")
                expect(result).not.toHaveProperty("error")
            })

        it("returns the exact typed result reference",
            async () => {
                const findOne = jest.fn().mockResolvedValue(buildJob({
                    refs: {
                        resultKind: "challenge-submission-attempt",
                        resultId: "attempt-1",
                    },
                }))
                const service = new JobStatusReadService({
                    findOne,
                } as unknown as EntityManager)

                const result = await service.getOwned({
                    jobId: "job-1",
                    userId: "user-1",
                })

                expect(result).toMatchObject({
                    status: JobStatus.Completed,
                    result: {
                        kind: "challenge-submission-attempt",
                        id: "attempt-1",
                    },
                })
            })

        it("returns null when no owned row exists",
            async () => {
                const findOne = jest.fn().mockResolvedValue(null)
                const service = new JobStatusReadService({
                    findOne,
                } as unknown as EntityManager)

                await expect(service.getOwned({
                    jobId: "job-other",
                    userId: "user-1",
                })).resolves.toBeNull()
            })
    })
