import {
    JobEntity,
    JobStatus,
} from "@modules/databases"
import {
    envConfig,
} from "@modules/env"
import {
    DayjsService,
} from "@modules/mixin"
import {
    Injectable,
} from "@nestjs/common"
import {
    In,
    LessThan,
} from "typeorm"
import type {
    GetStalledJobsParams,
    GetStalledJobsResult,
    RequeueJobParams,
} from "../types"
import {
    InjectPrimaryPostgreSQLEntityManager 
} from "@modules/databases"
import type {
    EntityManager,
} from "typeorm"
import {
    JobNotFoundException,
} from "@modules/exceptions"

/**
 * Service for querying stalled jobs based on queue time threshold.
 */
@Injectable()
export class JobStalledService {
    constructor(
        private readonly dayjsService: DayjsService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly primaryEntityManager: EntityManager,
    ) {}

    /**
     * Get all jobs still processing but queued longer than `envConfig().job.stalled`.
     * @param params - The parameters.
     * @param params.entityManager - The entity manager.
     * @param params.actionType - The action type to filter by.
     * @returns Stalled jobs.
     */
    async getStalledJobs(
        {
            entityManager,
            actionType,
        }: GetStalledJobsParams
    ): Promise<GetStalledJobsResult> {
        const manager = entityManager ?? this.primaryEntityManager
        const staleBefore = this.dayjsService.now().subtract(
            envConfig().job.stalled.thresholdMs,
            "millisecond",
        ).toDate()
        return manager.find(
            JobEntity,
            {
                where: {
                    status: In(
                        [
                            JobStatus.Processing,
                            JobStatus.Queued
                        ]
                    ),
                    queueAt: LessThan(staleBefore),
                    actionType,
                },
            },
        )
    }

    /**
     * Requeue a job.
     * @param params - The parameters.
     * @param params.id - The ID of the job.
     * @param params.entityManager - The entity manager.
     * @returns The job.
     */
    async requeueJob(
        {
            id,
            entityManager,
        }: RequeueJobParams
    ): Promise<JobEntity> {
        // get the manager
        const manager = entityManager ?? this.primaryEntityManager
        // reset the queue at time
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
                }
            )
        }
        job.queueAt = this.dayjsService.now().toDate()
        // save the job record
        await manager.save(
            job,
        )
        // return the job
        return job
    }
}
