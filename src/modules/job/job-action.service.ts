import {
    JobEntity,
    JobStatus,
} from "@modules/databases"
import {
    Injectable,
} from "@nestjs/common"
import type {
    CompleteJobParams,
    CompleteJobResult,
    CreateJobParams,
    CreateJobResult,
    FailJobParams,
    FailJobResult,
    IncreaseJobParams,
    IncreaseJobResult,
} from "./types"
import {
    JobCommonService,
} from "./job-common.service"

/**
 * Service for job lifecycle management:
 * create -> increase steps -> complete/fail.
 * Supports optional transactional entity manager.
 */
@Injectable()
export class JobActionService {
    constructor(
        private readonly jobCommonService: JobCommonService,
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
        queueName,
        bullmqJobId = null,
        payload = null,
        maxSteps = 0,
        entityManager,
    }: CreateJobParams): Promise<CreateJobResult> {
        const manager = this.jobCommonService.getManager({
            entityManager,
        })
        const job = manager.create(
            JobEntity,
            {
                queueName,
                bullmqJobId,
                payload,
                status: JobStatus.Processing,
                error: null,
                currentStep: 0,
                maxSteps,
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
     * @param target - The target parameters.
     * @returns The job.
     */
    async increaseJob({
        step = 1,
        entityManager,
        ...target
    }: IncreaseJobParams): Promise<IncreaseJobResult> {
        const manager = this.jobCommonService.getManager({
            entityManager,
        })
        const job = await this.jobCommonService.getJobOrThrow({
            ...target,
            entityManager: manager,
        })
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
     * @param target - The target parameters.
     * @returns The job.
     */
    async completeJob({
        entityManager,
        ...target
    }: CompleteJobParams): Promise<CompleteJobResult> {
        const manager = this.jobCommonService.getManager({
            entityManager,
        })
        const job = await this.jobCommonService.getJobOrThrow({
            ...target,
            entityManager: manager,
        })
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
     * @param target - The target parameters.
     * @returns The job.
     */
    async failJob({
        error = null,
        entityManager,
        ...target
    }: FailJobParams): Promise<FailJobResult> {
        const manager = this.jobCommonService.getManager({
            entityManager,
        })
        const job = await this.jobCommonService.getJobOrThrow({
            ...target,
            entityManager: manager,
        })
        job.status = JobStatus.Failed
        job.error = error
        return manager.save(
            JobEntity,
            job,
        )
    }
}
