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
    UpdateQueueAtParams,
    UpdateQueueAtResult,
} from "./types"
import {
    JobCommonService,
} from "./job-common.service"

/**
 * Service for querying stalled jobs based on queue time threshold.
 */
@Injectable()
export class JobStalledService {
    constructor(
        private readonly jobCommonService: JobCommonService,
        private readonly dayjsService: DayjsService,
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
        const manager = this.jobCommonService.getManager({
            entityManager,
        })
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
     * Update the queue at time of a job.
     * @param job - The job to update.
     * @returns The updated job.
     */
    async updateQueueAt({
        entityManager,
    }: UpdateQueueAtParams): Promise<UpdateQueueAtResult> {
        const manager = this.jobCommonService.getManager({
            entityManager,
        })
        const now = this.dayjsService.now().toDate()
        const updateResult = await manager.update(
            JobEntity,
            {
                status: JobStatus.Processing,
                queueAt: LessThan(now),
            },
            {
                queueAt: now,
            },
        )
        return updateResult.affected ?? 0
    }
}
