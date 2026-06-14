import {
    JobEntity,
    JobStatus,
} from "@modules/databases"
import {
    DayjsService,
} from "@modules/mixin"
import {
    Injectable,
} from "@nestjs/common"
import type {
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
 * Manual, user-triggered requeue of a job. (Automatic stalled-job recovery is owned by
 * BullMQ — lock + `stalledInterval` + `maxStalledCount` — so the old Postgres `queueAt`
 * sweeper / `getStalledJobs` scan was removed.)
 */
@Injectable()
export class JobStalledService {
    constructor(
        private readonly dayjsService: DayjsService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly primaryEntityManager: EntityManager,
    ) {}

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
        // requeue for a fresh run: reset the queue clock + status, bump the fencing token so any
        // in-flight zombie worker is fenced out, and reset the attempt budget. currentStep is kept
        // so the job resumes where it left off (side effects are idempotency-keyed, so resuming
        // never double-applies).
        job.queueAt = this.dayjsService.now().toDate()
        job.status = JobStatus.Queued
        job.fencingToken += 1
        job.attempts = 0
        job.error = null
        // save the job record
        await manager.save(
            job,
        )
        // return the job
        return job
    }
}
