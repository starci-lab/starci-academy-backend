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
    CompleteJobResult,
    CreateJobParams,
    CreateJobResult,
    FailJobParams,
    FailJobResult,
    IncreaseJobParams,
    IncreaseJobResult,
} from "../types"   
import {
    DayjsService 
} from "@modules/mixin"
import {
    JobNotFoundException,
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
    ) {}

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
    }: CreateJobParams): Promise<CreateJobResult> {
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
     * @param id - The ID of the job.
     * @returns The job.
     */
    async increaseJob({
        step = 1,
        entityManager,
        id,
    }: IncreaseJobParams): Promise<IncreaseJobResult> {
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
        job.currentStep += step
        if (job.maxSteps > 0 && job.currentStep >= job.maxSteps) {
            job.currentStep = job.maxSteps
            job.status = JobStatus.Completed
            job.error = null
        }
        return manager.save(
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
        id,
    }: CompleteJobParams): Promise<CompleteJobResult> {
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
        job.status = JobStatus.Completed
        if (job.maxSteps > 0 && job.currentStep < job.maxSteps) {
            job.currentStep = job.maxSteps
        }
        job.error = null
        return manager.save(
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
        id,
    }: FailJobParams): Promise<FailJobResult> {
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
        job.status = JobStatus.Failed
        job.error = error
        return manager.save(
            JobEntity,
            job,
        )
    }
}
