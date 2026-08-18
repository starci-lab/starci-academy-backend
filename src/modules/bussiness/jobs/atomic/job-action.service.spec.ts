import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    IsNull,
} from "typeorm"
import SuperJSON from "superjson"
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
    DayjsService,
} from "@modules/lib/mixin/dayjs.service"
import {
    SUPERJSON,
} from "@modules/lib/mixin/constants/superjson"
import {
    EventName,
} from "@modules/platform/event/enums/event-name"
import {
    EventEmitterService,
} from "@modules/platform/event/event-emitter.service"
import {
    JobFencedOutException,
    JobNotFoundException,
} from "@modules/platform/exceptions/errors/job/not-found"
import {
    makeEntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import type {
    EntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import {
    JobActionService,
} from "./job-action.service"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/**
 * Build a job row with worker-loop defaults; pass overrides to model a
 * mid-flight / fenced / result-carrying state per test.
 */
const buildJob = (
    overrides: Partial<JobEntity> = {
    },
): JobEntity => ({
    id: "job-1",
    actionType: ActionType.SendMail,
    category: JobCategory.SubmitChallenge,
    status: JobStatus.Queued,
    currentStep: 0,
    maxSteps: 3,
    fencingToken: 4,
    error: null,
    executionResults: null,
    userId: "user-1",
    refs: {
    },
    ...overrides,
}) as JobEntity

describe("JobActionService",
    () => {
        let module: TestingModule
        let service: JobActionService
        let primaryEntityManager: EntityManagerMock
        let transactionalEntityManager: EntityManagerMock
        let emit: jest.Mock

        beforeEach(async () => {
            primaryEntityManager = makeEntityManagerMock()
            // a DIFFERENT manager instance, so "used the caller's manager" is a
            // distinguishable observation rather than a coincidence
            transactionalEntityManager = makeEntityManagerMock()
            emit = jest.fn().mockResolvedValue(undefined)

            module = await Test.createTestingModule({
                providers: [
                    JobActionService,
                    // DayjsService is a pure dayjs wrapper (no I/O) -> use the real one
                    DayjsService,
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: primaryEntityManager,
                    },
                    {
                        provide: SUPERJSON,
                        useValue: new SuperJSON(),
                    },
                    {
                        provide: EventEmitterService,
                        useValue: {
                            emit,
                        },
                    },
                ],
            }).compile()

            service = module.get<JobActionService>(JobActionService)
        })

        afterEach(async () => {
            await module.close()
        })

        describe("getJob",
            () => {
                it("loads the job by id alone when no caller scope is given",
                    async () => {
                        const job = buildJob()
                        primaryEntityManager.findOne.mockResolvedValueOnce(job)

                        await expect(service.getJob({
                            id: "job-1",
                        })).resolves.toBe(job)

                        expect(primaryEntityManager.findOne).toHaveBeenCalledWith(
                            JobEntity,
                            {
                                where: {
                                    id: "job-1",
                                },
                            },
                        )
                    })

                it("scopes the lookup to the caller so another owner's job never leaves the query",
                    async () => {
                        primaryEntityManager.findOne.mockResolvedValueOnce(buildJob())

                        await service.getJob({
                            id: "job-1",
                            userId: "user-1",
                        })

                        expect(primaryEntityManager.findOne.mock.calls[0][1]).toEqual({
                            where: {
                                id: "job-1",
                                userId: "user-1",
                            },
                        })
                    })

                it("matches only ownerless system jobs when the caller scope is explicitly null",
                    async () => {
                        primaryEntityManager.findOne.mockResolvedValueOnce(buildJob({
                            userId: null,
                        }))

                        await service.getJob({
                            id: "job-1",
                            userId: null,
                        })

                        const where = primaryEntityManager.findOne.mock.calls[0][1].where
                        expect(where.userId).toEqual(IsNull())
                    })

                it("reads through the caller's transactional manager when one is supplied",
                    async () => {
                        transactionalEntityManager.findOne.mockResolvedValueOnce(buildJob())

                        await service.getJob({
                            id: "job-1",
                            entityManager: transactionalEntityManager as never,
                        })

                        expect(transactionalEntityManager.findOne).toHaveBeenCalled()
                        expect(primaryEntityManager.findOne).not.toHaveBeenCalled()
                    })

                it("reports a missing row as JobNotFoundException carrying the id",
                    async () => {
                        primaryEntityManager.findOne.mockResolvedValueOnce(null)

                        const error = await service.getJob({
                            id: "ghost",
                        }).catch((thrown: unknown) => thrown)

                        expect(error).toBeInstanceOf(JobNotFoundException)
                        expect((error as JobNotFoundException).metadata).toMatchObject({
                            id: "ghost",
                        })
                    })
            })

        describe("createJob",
            () => {
                it("queues a job with its category, owner and correlation refs",
                    async () => {
                        await service.createJob({
                            id: "job-1",
                            actionType: ActionType.ProcessGitSubmission,
                            category: JobCategory.SubmitChallenge,
                            payload: "{}",
                            maxSteps: 5,
                            userId: "user-1",
                            challengeSubmissionId: "sub-1",
                            refs: {
                                enrollmentId: "enrollment-1",
                            },
                        })

                        expect(primaryEntityManager.create).toHaveBeenCalledWith(
                            JobEntity,
                            expect.objectContaining({
                                id: "job-1",
                                actionType: ActionType.ProcessGitSubmission,
                                category: JobCategory.SubmitChallenge,
                                payload: "{}",
                                status: JobStatus.Queued,
                                currentStep: 0,
                                maxSteps: 5,
                                userId: "user-1",
                                refs: {
                                    challengeSubmissionId: "sub-1",
                                    enrollmentId: "enrollment-1",
                                },
                            }),
                        )
                        const created = primaryEntityManager.create.mock.calls[0][1]
                        expect(created.queueAt).toBeInstanceOf(Date)
                        expect(primaryEntityManager.save).toHaveBeenCalledWith(
                            JobEntity,
                            created,
                        )
                    })

                it("omits the category key entirely for a job with no UI bucket, and defaults maxSteps + owner",
                    async () => {
                        await service.createJob({
                            id: "job-2",
                            actionType: ActionType.SendMail,
                            payload: "{}",
                            maxSteps: undefined as unknown as number,
                        })

                        const created = primaryEntityManager.create.mock.calls[0][1]
                        // a system job carries no owner and no category key at all
                        expect(created).not.toHaveProperty("category")
                        expect(created.userId).toBeNull()
                        expect(created.maxSteps).toBe(0)
                        // no submission and no extra refs -> an empty (but present) refs map
                        expect(created.refs).toEqual({
                        })
                    })

                it("treats a null category as absent but keeps an explicit refs map",
                    async () => {
                        await service.createJob({
                            id: "job-3",
                            actionType: ActionType.SendMail,
                            category: null as unknown as JobCategory,
                            payload: "{}",
                            maxSteps: 1,
                            userId: null,
                            challengeSubmissionId: null,
                            refs: {
                                enrollmentId: "enrollment-2",
                            },
                        })

                        const created = primaryEntityManager.create.mock.calls[0][1]
                        expect(created).not.toHaveProperty("category")
                        expect(created.refs).toEqual({
                            enrollmentId: "enrollment-2",
                        })
                    })

                it("writes through the caller's transactional manager",
                    async () => {
                        await service.createJob({
                            id: "job-4",
                            actionType: ActionType.SendMail,
                            payload: "{}",
                            maxSteps: 1,
                            entityManager: transactionalEntityManager as never,
                        })

                        expect(transactionalEntityManager.save).toHaveBeenCalled()
                        expect(primaryEntityManager.save).not.toHaveBeenCalled()
                    })
            })

        describe("increaseJob",
            () => {
                it("advances by one step and persists when no fencing token is demanded",
                    async () => {
                        const job = buildJob({
                            currentStep: 1,
                        })

                        await service.increaseJob({
                            job,
                        })

                        expect(job.currentStep).toBe(2)
                        expect(primaryEntityManager.save).toHaveBeenCalledWith(JobEntity,
                            job)
                        expect(primaryEntityManager.increment).not.toHaveBeenCalled()
                    })

                it("advances by an explicit step size",
                    async () => {
                        const job = buildJob({
                            currentStep: 1,
                        })

                        await service.increaseJob({
                            job,
                            step: 3,
                        })

                        expect(job.currentStep).toBe(4)
                    })

                it("guards the advance on the fencing token and skips the full-row save",
                    async () => {
                        const job = buildJob({
                            currentStep: 1,
                        })
                        primaryEntityManager.increment.mockResolvedValueOnce({
                            affected: 1,
                        })

                        await service.increaseJob({
                            job,
                            step: 2,
                            expectedFencingToken: 4,
                        })

                        expect(primaryEntityManager.increment).toHaveBeenCalledWith(
                            JobEntity,
                            {
                                id: "job-1",
                                fencingToken: 4,
                            },
                            "currentStep",
                            2,
                        )
                        expect(job.currentStep).toBe(3)
                        // the guarded path writes the single column, never the whole row
                        expect(primaryEntityManager.save).not.toHaveBeenCalled()
                    })

                it("rejects the advance and leaves the step untouched when a newer worker owns the job",
                    async () => {
                        const job = buildJob({
                            currentStep: 1,
                        })
                        primaryEntityManager.increment.mockResolvedValueOnce({
                            affected: 0,
                        })

                        const error = await service.increaseJob({
                            job,
                            expectedFencingToken: 4,
                        }).catch((thrown: unknown) => thrown)

                        expect(error).toBeInstanceOf(JobFencedOutException)
                        expect((error as JobFencedOutException).metadata).toMatchObject({
                            id: "job-1",
                            expectedFencingToken: 4,
                        })
                        expect(job.currentStep).toBe(1)
                    })

                it("guards through the caller's transactional manager",
                    async () => {
                        transactionalEntityManager.increment.mockResolvedValueOnce({
                            affected: 1,
                        })

                        await service.increaseJob({
                            job: buildJob(),
                            expectedFencingToken: 4,
                            entityManager: transactionalEntityManager as never,
                        })

                        expect(transactionalEntityManager.increment).toHaveBeenCalled()
                        expect(primaryEntityManager.increment).not.toHaveBeenCalled()
                    })
            })

        describe("completeJob",
            () => {
                it("snaps an unfinished job's progress to maxSteps, clears the error and announces it",
                    async () => {
                        const job = buildJob({
                            currentStep: 1,
                            maxSteps: 3,
                            error: "earlier failure",
                            refs: {
                                challengeSubmissionId: "sub-1",
                            },
                        })

                        await service.completeJob({
                            job,
                        })

                        expect(job.status).toBe(JobStatus.Completed)
                        expect(job.currentStep).toBe(3)
                        expect(job.error).toBeNull()
                        expect(primaryEntityManager.save).toHaveBeenCalledWith(JobEntity,
                            job)
                        expect(emit).toHaveBeenCalledWith({
                            event: EventName.JobStatusUpdated,
                            payload: {
                                jobId: "job-1",
                                challengeSubmissionId: "sub-1",
                                category: JobCategory.SubmitChallenge,
                                status: JobStatus.Completed,
                            },
                        })
                    })

                it("keeps the current step when the job has no declared step count",
                    async () => {
                        const job = buildJob({
                            currentStep: 2,
                            maxSteps: 0,
                        })

                        await service.completeJob({
                            job,
                        })

                        expect(job.currentStep).toBe(2)
                    })

                it("keeps the current step when the job already reached its last step",
                    async () => {
                        const job = buildJob({
                            currentStep: 3,
                            maxSteps: 3,
                        })

                        await service.completeJob({
                            job,
                        })

                        expect(job.currentStep).toBe(3)
                    })

                it("completes under a fencing guard without a full-row save",
                    async () => {
                        const job = buildJob({
                            currentStep: 1,
                            maxSteps: 3,
                        })
                        primaryEntityManager.update.mockResolvedValueOnce({
                            affected: 1,
                        })

                        await service.completeJob({
                            job,
                            expectedFencingToken: 4,
                        })

                        expect(primaryEntityManager.update).toHaveBeenCalledWith(
                            JobEntity,
                            {
                                id: "job-1",
                                fencingToken: 4,
                            },
                            {
                                status: JobStatus.Completed,
                                error: null,
                                currentStep: 3,
                            },
                        )
                        expect(job.status).toBe(JobStatus.Completed)
                        expect(job.currentStep).toBe(3)
                        expect(primaryEntityManager.save).not.toHaveBeenCalled()
                        expect(emit).toHaveBeenCalled()
                    })

                it("refuses to complete and emits nothing when the job was fenced out",
                    async () => {
                        const job = buildJob({
                            status: JobStatus.Processing,
                        })
                        primaryEntityManager.update.mockResolvedValueOnce({
                            affected: 0,
                        })

                        await expect(service.completeJob({
                            job,
                            expectedFencingToken: 4,
                        })).rejects.toBeInstanceOf(JobFencedOutException)

                        expect(job.status).toBe(JobStatus.Processing)
                        expect(emit).not.toHaveBeenCalled()
                    })

                it("stays silent when the caller opted out of the change event",
                    async () => {
                        await service.completeJob({
                            job: buildJob(),
                            emitChangeEvent: false,
                            entityManager: transactionalEntityManager as never,
                        })

                        expect(emit).not.toHaveBeenCalled()
                        expect(transactionalEntityManager.save).toHaveBeenCalled()
                    })

                it("announces an undefined submission id for a job with no refs at all",
                    async () => {
                        await service.completeJob({
                            job: buildJob({
                                refs: undefined,
                            }),
                        })

                        expect(emit.mock.calls[0][0].payload.challengeSubmissionId).toBeUndefined()
                    })
            })

        describe("failJob",
            () => {
                it("records the error, persists it and announces the failure",
                    async () => {
                        const job = buildJob({
                            refs: {
                                challengeSubmissionId: "sub-1",
                            },
                        })

                        await service.failJob({
                            job,
                            error: "grader crashed",
                        })

                        expect(job.status).toBe(JobStatus.Failed)
                        expect(job.error).toBe("grader crashed")
                        expect(primaryEntityManager.save).toHaveBeenCalledWith(JobEntity,
                            job)
                        expect(emit).toHaveBeenCalledWith({
                            event: EventName.JobStatusUpdated,
                            payload: {
                                jobId: "job-1",
                                challengeSubmissionId: "sub-1",
                                category: JobCategory.SubmitChallenge,
                                status: JobStatus.Failed,
                                error: "grader crashed",
                            },
                        })
                    })

                it("normalizes a missing error message to null and omits it from the event",
                    async () => {
                        const job = buildJob()

                        await service.failJob({
                            job,
                        })

                        expect(job.error).toBeNull()
                        expect(emit.mock.calls[0][0].payload.error).toBeUndefined()
                    })

                it("fails under a fencing guard without a full-row save",
                    async () => {
                        const job = buildJob()
                        primaryEntityManager.update.mockResolvedValueOnce({
                            affected: 1,
                        })

                        await service.failJob({
                            job,
                            error: "boom",
                            expectedFencingToken: 4,
                        })

                        expect(primaryEntityManager.update).toHaveBeenCalledWith(
                            JobEntity,
                            {
                                id: "job-1",
                                fencingToken: 4,
                            },
                            {
                                status: JobStatus.Failed,
                                error: "boom",
                            },
                        )
                        expect(job.status).toBe(JobStatus.Failed)
                        expect(primaryEntityManager.save).not.toHaveBeenCalled()
                    })

                it("refuses to fail and emits nothing when the job was fenced out",
                    async () => {
                        const job = buildJob({
                            status: JobStatus.Processing,
                        })
                        primaryEntityManager.update.mockResolvedValueOnce({
                            affected: 0,
                        })

                        const error = await service.failJob({
                            job,
                            expectedFencingToken: 9,
                        }).catch((thrown: unknown) => thrown)

                        expect(error).toBeInstanceOf(JobFencedOutException)
                        expect((error as JobFencedOutException).metadata).toMatchObject({
                            expectedFencingToken: 9,
                        })
                        expect(job.status).toBe(JobStatus.Processing)
                        expect(emit).not.toHaveBeenCalled()
                    })

                it("stays silent when the caller opted out of the change event",
                    async () => {
                        await service.failJob({
                            job: buildJob(),
                            emitChangeEvent: false,
                            entityManager: transactionalEntityManager as never,
                        })

                        expect(emit).not.toHaveBeenCalled()
                        expect(transactionalEntityManager.save).toHaveBeenCalled()
                    })
            })

        describe("processingJob",
            () => {
                it("claims the job by bumping the fencing token and announces the transition",
                    async () => {
                        const job = buildJob({
                            fencingToken: 4,
                            refs: {
                                challengeSubmissionId: "sub-1",
                            },
                        })

                        await service.processingJob({
                            job,
                        })

                        expect(job.status).toBe(JobStatus.Processing)
                        // the bumped token is what later guarded writes must present
                        expect(job.fencingToken).toBe(5)
                        expect(primaryEntityManager.save).toHaveBeenCalledWith(JobEntity,
                            job)
                        expect(emit).toHaveBeenCalledWith({
                            event: EventName.JobStatusUpdated,
                            payload: {
                                jobId: "job-1",
                                challengeSubmissionId: "sub-1",
                                category: JobCategory.SubmitChallenge,
                                status: JobStatus.Processing,
                            },
                        })
                    })

                it("omits the submission key and reports an undefined category for an unattached job",
                    async () => {
                        await service.processingJob({
                            job: buildJob({
                                category: null,
                                refs: {
                                },
                            }),
                        })

                        const payload = emit.mock.calls[0][0].payload
                        expect(payload).not.toHaveProperty("challengeSubmissionId")
                        expect(payload.category).toBeUndefined()
                    })

                it("stays silent when the caller opted out of the change event",
                    async () => {
                        await service.processingJob({
                            job: buildJob(),
                            emitChangeEvent: false,
                            entityManager: transactionalEntityManager as never,
                        })

                        expect(emit).not.toHaveBeenCalled()
                        expect(transactionalEntityManager.save).toHaveBeenCalled()
                    })
            })

        describe("execution results",
            () => {
                it("stores the first result under its key and persists the serialized map",
                    async () => {
                        const job = buildJob({
                            executionResults: null,
                        })

                        await service.saveExecutionResult({
                            job,
                            key: "grade",
                            executionResult: {
                                score: 8,
                            },
                        })

                        expect(primaryEntityManager.save).toHaveBeenCalledWith(JobEntity,
                            job)
                        await expect(service.loadExecutionResult({
                            job,
                            key: "grade",
                        })).resolves.toEqual({
                            score: 8,
                        })
                    })

                it("merges a second result into the existing map without losing the first",
                    async () => {
                        const job = buildJob()

                        await service.saveExecutionResult({
                            job,
                            key: "grade",
                            executionResult: {
                                score: 8,
                            },
                        })
                        await service.saveExecutionResult({
                            job,
                            key: "review",
                            executionResult: "looks good",
                        })

                        await expect(service.loadExecutionResult({
                            job,
                            key: "grade",
                        })).resolves.toEqual({
                            score: 8,
                        })
                        await expect(service.loadExecutionResult({
                            job,
                            key: "review",
                        })).resolves.toBe("looks good")
                    })

                it("round-trips a Date through SuperJSON rather than degrading it to a string",
                    async () => {
                        const job = buildJob()
                        const gradedAt = new Date("2026-08-19T00:00:00.000Z")

                        await service.saveExecutionResult({
                            job,
                            key: "gradedAt",
                            executionResult: gradedAt,
                        })

                        await expect(service.loadExecutionResult({
                            job,
                            key: "gradedAt",
                        })).resolves.toEqual(gradedAt)
                    })

                it("writes the serialized map through the caller's transactional manager",
                    async () => {
                        await service.saveExecutionResult({
                            job: buildJob(),
                            key: "grade",
                            executionResult: 1,
                            entityManager: transactionalEntityManager as never,
                        })

                        expect(transactionalEntityManager.save).toHaveBeenCalled()
                        expect(primaryEntityManager.save).not.toHaveBeenCalled()
                    })

                it("reads undefined for a key that was never stored on an empty job",
                    async () => {
                        await expect(service.loadExecutionResult({
                            job: buildJob({
                                executionResults: null,
                            }),
                            key: "missing",
                        })).resolves.toBeUndefined()
                    })
            })
    })
