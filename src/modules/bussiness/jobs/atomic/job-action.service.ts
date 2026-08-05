import {
    JobEntity,
} from "@modules/databases/postgresql/primary/entities/job.entity"
import {
    JobStatus,
} from "@modules/databases/postgresql/primary/enums/job-status"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    Injectable,
} from "@nestjs/common"
import type {
    EntityManager,
    FindOptionsWhere,
} from "typeorm"
import {
    IsNull,
} from "typeorm"
import type {
    CompleteJobParams,
    GetJobParams,
    CreateJobParams,
    FailJobParams,
    IncreaseJobParams,
    SaveExecutionResultParams,
    LoadExecutionResultParams,
    ProcessingJobParams,
} from "../types/job"
import {
    DayjsService,
} from "@modules/lib/mixin/dayjs.service"
import {
    InjectSuperJson,
} from "@modules/lib/mixin/superjson.providers"
import {
    SuperJSON,
} from "superjson"
import {
    JobFencedOutException,
    JobNotFoundException,
} from "@modules/platform/exceptions/errors/job/not-found"
import {
    EventName,
} from "@modules/platform/event/enums/event-name"
import {
    EventEmitterService,
} from "@modules/platform/event/event-emitter.service"

@Injectable()
/**
 * Service for job lifecycle management:
 * create -> increase steps -> complete/fail.
 * Supports optional transactional entity manager.
 */
export class JobActionService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly primaryEntityManager: EntityManager,
        private readonly dayjsService: DayjsService,
        @InjectSuperJson()
        private readonly superJson: SuperJSON,
        private readonly eventEmitterService: EventEmitterService,
    ) { }

    /**
     * Get the job.
     * @param id - The ID of the job.
     * @param entityManager - The entity manager.
     * @param userId - Optional caller to scope the lookup to. When provided,
     * a job owned by someone else (or with no owner) never leaves the query --
     * it surfaces as `JobNotFoundException`, same as a genuinely missing row.
     * @returns The job.
     */
    async getJob(
        {
            entityManager,
            id,
            userId,
        }: GetJobParams
    ): Promise<JobEntity> {
        const manager = entityManager ?? this.primaryEntityManager
        const where: FindOptionsWhere<JobEntity> = {
            id 
        }
        if (userId !== undefined) {
            where.userId = userId === null ? IsNull() : userId
        }
        const job = await manager.findOne(
            JobEntity,
            {
                where,
            },
        )
        if (!job) {
            throw new JobNotFoundException(
                {
                    id,
                },
            )
        }
        return job
    }

    /**
     * Create a job. Domain ids are stored loosely: `userId` as a plain (FK-less)
     * column, everything else under `jobs.refs` -- `jobs` keeps no FK to domain.
     * @param params - The job creation params.
     * @returns The job.
     */
    async createJob({
        id,
        actionType,
        category,
        payload,
        maxSteps = 0,
        userId,
        entityManager,
        challengeSubmissionId,
        refs,
    }: CreateJobParams): Promise<JobEntity> {
        const manager = entityManager ?? this.primaryEntityManager
        const job = manager.create(
            JobEntity,
            {
                id,
                actionType,
                payload,
                ...(category != null ? {
                    category,
                } : {
                }),
                status: JobStatus.Queued,
                currentStep: 0,
                maxSteps,
                queueAt: this.dayjsService.now().toDate(),
                userId: userId ?? null,
                refs: {
                    ...(challengeSubmissionId ? {
                        challengeSubmissionId,
                    } : {
                    }),
                    ...(refs ?? {
                    }),
                },
            },
        )
        return manager.save(
            JobEntity,
            job,
        )
    }

    /**
     * Increase the job step. When `expectedFencingToken` is given, the advance is
     * guarded -- it only lands if the row still carries that token; otherwise a
     * {@link JobFencedOutException} is thrown (a newer worker owns this job).
     * @param params - step / job / entityManager / expectedFencingToken.
     */
    async increaseJob({
        step = 1,
        entityManager,
        job,
        expectedFencingToken,
    }: IncreaseJobParams): Promise<void> {
        const manager = entityManager ?? this.primaryEntityManager
        if (expectedFencingToken != null) {
            const result = await manager.increment(
                JobEntity,
                {
                    id: job.id,
                    fencingToken: expectedFencingToken,
                },
                "currentStep",
                step,
            )
            if (!result.affected) {
                throw new JobFencedOutException({
                    id: job.id,
                    expectedFencingToken,
                })
            }
            job.currentStep += step
            return
        }
        job.currentStep += step
        await manager.save(
            JobEntity,
            job,
        )
    }

    /**
     * Complete the job. Optionally fencing-guarded (see {@link increaseJob}).
     * @param params - job / entityManager / emitChangeEvent / expectedFencingToken.
     */
    async completeJob({
        entityManager,
        job,
        emitChangeEvent = true,
        expectedFencingToken,
    }: CompleteJobParams): Promise<void> {
        const manager = entityManager ?? this.primaryEntityManager
        const nextStep = job.maxSteps > 0 && job.currentStep < job.maxSteps
            ? job.maxSteps
            : job.currentStep
        if (expectedFencingToken != null) {
            const result = await manager.update(
                JobEntity,
                {
                    id: job.id,
                    fencingToken: expectedFencingToken,
                },
                {
                    status: JobStatus.Completed,
                    error: null,
                    currentStep: nextStep,
                },
            )
            if (!result.affected) {
                throw new JobFencedOutException({
                    id: job.id,
                    expectedFencingToken,
                })
            }
            job.status = JobStatus.Completed
            job.error = null
            job.currentStep = nextStep
        } else {
            job.status = JobStatus.Completed
            job.currentStep = nextStep
            job.error = null
            await manager.save(
                JobEntity,
                job,
            )
        }
        if (emitChangeEvent) {
            await this.eventEmitterService.emit(
                {
                    event: EventName.JobStatusUpdated,
                    payload: {
                        jobId: job.id,
                        challengeSubmissionId: job.refs?.challengeSubmissionId,
                        category: job.category,
                        status: job.status,
                    },
                }
            )
        }
    }

    /**
     * Fail the job. Optionally fencing-guarded (see {@link increaseJob}).
     * @param params - error / job / entityManager / emitChangeEvent / expectedFencingToken.
     */
    async failJob({
        error,
        entityManager,
        job,
        emitChangeEvent = true,
        expectedFencingToken,
    }: FailJobParams): Promise<void> {
        const manager = entityManager ?? this.primaryEntityManager
        const nextError = error ?? null
        if (expectedFencingToken != null) {
            const result = await manager.update(
                JobEntity,
                {
                    id: job.id,
                    fencingToken: expectedFencingToken,
                },
                {
                    status: JobStatus.Failed,
                    error: nextError,
                },
            )
            if (!result.affected) {
                throw new JobFencedOutException({
                    id: job.id,
                    expectedFencingToken,
                })
            }
            job.status = JobStatus.Failed
            job.error = nextError
        } else {
            job.status = JobStatus.Failed
            job.error = nextError
            await manager.save(
                JobEntity,
                job,
            )
        }
        if (emitChangeEvent) {
            await this.eventEmitterService.emit({
                event: EventName.JobStatusUpdated,
                payload: {
                    jobId: job.id,
                    challengeSubmissionId: job.refs?.challengeSubmissionId,
                    category: job.category,
                    status: job.status,
                    error: job.error ?? undefined,
                },
            })
        }
    }

    /**
     * Update the job status to processing and claim it by bumping the fencing token.
     * The bumped token is returned in `job.fencingToken` so the worker can pass it to
     * later guarded writes ({@link increaseJob} / {@link completeJob}).
     * @param params - job / entityManager / emitChangeEvent.
     */
    async processingJob({
        emitChangeEvent = true,
        entityManager,
        job,
    }: ProcessingJobParams): Promise<void> {
        const manager = entityManager ?? this.primaryEntityManager
        job.status = JobStatus.Processing
        job.fencingToken += 1
        await manager.save(
            JobEntity,
            job,
        )
        if (emitChangeEvent) {
            await this.eventEmitterService.emit({
                event: EventName.JobStatusUpdated,
                payload: {
                    jobId: job.id,
                    ...(job.refs?.challengeSubmissionId ? {
                        challengeSubmissionId: job.refs.challengeSubmissionId,
                    } : {
                    }),
                    category: job.category ?? undefined,
                    status: job.status,
                },
            })
        }
    }

    /**
     * Store the job result.
     * @param entityManager - The entity manager.
     * @param job - The job entity.
     * @param result - The result.
     * @returns The job.
     */
    async saveExecutionResult<T>({
        entityManager,
        job,
        key,
        executionResult,
    }: SaveExecutionResultParams<T>): Promise<void> {
        const manager = entityManager ?? this.primaryEntityManager
        const executionResults = job.executionResults ? this.superJson.parse<
            Record<string, unknown>
        >(job.executionResults) : {
        }
        executionResults[key] = executionResult
        job.executionResults = this.superJson.stringify(executionResults)
        await manager.save(
            JobEntity,
            job,
        )
    }

    /**
     * Load the execution result.
     * @param job - The job entity.
     * @param key - The key of the execution result.
     * @returns The execution result.
     */
    async loadExecutionResult<T>(
        {
            job,
            key,
        }: LoadExecutionResultParams
    ): Promise<T> {
        const executionResults = job.executionResults ? this.superJson.parse<
            Record<string, unknown>
        >(job.executionResults) : {
        }
        return executionResults[key] as T
    }
}
