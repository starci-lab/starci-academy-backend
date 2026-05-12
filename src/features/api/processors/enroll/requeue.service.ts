import {
    Injectable,
} from "@nestjs/common"
import {
    Interval,
} from "@nestjs/schedule"
import {
    EnqueueEnrollJobService,
    JobStalledService,
} from "@modules/bussiness"
import {
    ActionType,
} from "@modules/databases"
import {
    InjectSuperJson,
} from "@modules/mixin"
import SuperJSON from "superjson"
import {
    EnrollPayload,
} from "@modules/bullmq"
import {
    envConfig,
} from "@modules/env"

/**
 * Periodically re-enqueues stalled jobs.
 *
 * Stalled means: still Processing and `queueAt` older than `envConfig().job.stalled`.
 */
@Injectable()
export class EnrollRequeueService {
    constructor(
        private readonly jobStalledService: JobStalledService,
        private readonly enqueueEnrollJobService: EnqueueEnrollJobService,
        @InjectSuperJson()
        private readonly superJson: SuperJSON,
    ) {}

    /**
     * Handle the interval.
     */
    @Interval(envConfig().job.stalled.intervalMs)
    async handleInterval(): Promise<void> {
        const stalledJobs = await this.jobStalledService.getStalledJobs(
            {
                actionType: ActionType.Enroll,
            }
        )
        if (stalledJobs.length === 0) return

        // Requeue the jobs.
        for (const job of stalledJobs) {
            // IMPORTANT: payload is stored as text; it's the same value passed to BullMQ.
            const payload = this.superJson.parse<EnrollPayload>(job.payload)
            await this.enqueueEnrollJobService.enqueue(
                {
                    jobId: job.id,
                    ...payload,
                }
            )
        }
    }
}

