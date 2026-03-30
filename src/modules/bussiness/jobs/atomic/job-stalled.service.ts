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
     *
     * @param param - Optional transactional entity manager.
     * @returns Stalled jobs.
     */
    async getStalledJobs({
        entityManager,
    }: GetStalledJobsParams = {
    }): Promise<GetStalledJobsResult> {
        const manager = entityManager ?? this.primaryEntityManager
        const staleBefore = this.dayjsService.now().subtract(
            envConfig().job.stalled,
            "millisecond",
        ).toDate()
        return manager.find(
            JobEntity,
            {
                where: {
                    status: JobStatus.Processing,
                    queueAt: LessThan(staleBefore),
                },
            },
        )
    }

    /**
     * Requeue a job.
     * @param job - The job entity.
     * @param entityManager - The entity manager.
     * @returns The job.
     */
    async requeueJob(
        {
            job,
            entityManager,
        }: RequeueJobParams
    ): Promise<JobEntity> {
        // get the manager
        const manager = entityManager ?? this.primaryEntityManager
        // reset the queue at time
        job.queueAt = this.dayjsService.now().toDate()
        // save the job record
        return manager.save(
            JobEntity,
            job,
        )
    }
}
