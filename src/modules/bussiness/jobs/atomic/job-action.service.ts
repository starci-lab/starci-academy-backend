import {
    JobEntity,
    JobStatus,
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import {
    Injectable,
} from "@nestjs/common"
import type {
    EntityManager,
} from "typeorm"
import type {
    CompleteJobParams,
    GetJobParams,
    CreateJobParams,
    FailJobParams,
    IncreaseJobParams,
    SaveExecutionResultParams,
    LoadExecutionResultParams,
} from "../types"
import {
    DayjsService,
    InjectSuperJson
} from "@modules/mixin"
import {
    SuperJSON,
} from "superjson"
import {
    JobNotFoundException 
} from "@modules/exceptions"

/**
 * Service for job lifecycle management:
 * create -> increase steps -> complete/fail.
 * Supports optional transactional entity manager.
 */
@Injectable()
export class JobActionService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly primaryEntityManager: EntityManager,
        private readonly dayjsService: DayjsService,
        @InjectSuperJson()
        private readonly superJson: SuperJSON,
    ) { }

    /**
     * Get the job.
     * @param id - The ID of the job.
     * @param entityManager - The entity manager.
     * @returns The job.
     */
    async getJob(
        {
            entityManager,
            id,
        }: GetJobParams
    ): Promise<JobEntity> {
        const manager = entityManager ?? this.primaryEntityManager
        const job = await manager.findOne(
            JobEntity,
            {
                where: {
                    id,
                },
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
     * Create a job.
     * @param queueName - The queue name.
     * @param bullmqJobId - The BullMQ job ID.
     * @param payload - The payload.
     * @param maxSteps - The maximum steps.
     * @param entityManager - The entity manager.
     * @returns The job.
     */
    async createJob({
        id,
        actionType,
        payload,
        maxSteps = 0,
        entityManager,
    }: CreateJobParams): Promise<JobEntity> {
        const manager = entityManager ?? this.primaryEntityManager
        const job = manager.create(
            JobEntity,
            {
                id,
                actionType,
                payload,
                status: JobStatus.Processing,
                currentStep: 0,
                maxSteps,
                queueAt: this.dayjsService.now().toDate(),
            },
        )
        return manager.save(
            JobEntity,
            job,
        )
    }



    /**
     * Increase the job step.
     * @param step - The step to increase.
     * @param entityManager - The entity manager.
     * @param job - The job entity.
     * @returns The job.
     */
    async increaseJob({
        step = 1,
        entityManager,
        job,
    }: IncreaseJobParams): Promise<void> {
        const manager = entityManager ?? this.primaryEntityManager
        job.currentStep += step
        if (job.maxSteps > 0 && job.currentStep >= job.maxSteps) {
            job.currentStep = job.maxSteps
            job.status = JobStatus.Completed
            job.error = null
        }
        await manager.save(
            JobEntity,
            job,
        )
    }

    /**
     * Complete the job.
     * @param entityManager - The entity manager.
     * @param id - The ID of the job.
     * @returns The job.
     */
    async completeJob({
        entityManager,
        job,
    }: CompleteJobParams): Promise<void> {
        const manager = entityManager ?? this.primaryEntityManager
        job.status = JobStatus.Completed
        if (job.maxSteps > 0 && job.currentStep < job.maxSteps) {
            job.currentStep = job.maxSteps
        }
        job.error = null
        await manager.save(
            JobEntity,
            job,
        )
    }

    /**
     * Fail the job.
     * @param error - The error.
     * @param entityManager - The entity manager.
     * @param id - The ID of the job.
     * @returns The job.
     */
    async failJob({
        error = null,
        entityManager,
        job,
    }: FailJobParams): Promise<void> {
        const manager = entityManager ?? this.primaryEntityManager
        job.status = JobStatus.Failed
        job.error = error
        await manager.save(
            JobEntity,
            job,
        )
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
