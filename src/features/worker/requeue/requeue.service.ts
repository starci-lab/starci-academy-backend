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

type EnrollJobPayload = {
    transactionId: string
    userId: string
    courseId: string
}

/**
 * Periodically re-enqueues stalled jobs.
 *
 * Stalled means: still Processing and `queueAt` older than `envConfig().job.stalled`.
 */
@Injectable()
export class RequeueService {
    constructor(
        private readonly jobStalledService: JobStalledService,
        private readonly enqueueEnrollJobService: EnqueueEnrollJobService,
        @InjectSuperJson()
        private readonly superJson: SuperJSON,
    ) {}

    @Interval(
        30_000,
    )
    async handleInterval(): Promise<void> {
        const stalledJobs = await this.jobStalledService.getStalledJobs()
        if (stalledJobs.length === 0) {
            return
        }

        // Requeue per action type (currently only Enroll is supported here).
        for (const job of stalledJobs) {
            if (job.actionType !== ActionType.Enroll) {
                continue
            }
            // IMPORTANT: payload is stored as text; it's the same value passed to BullMQ.
            let payload: EnrollJobPayload
            try {
                payload = this.superJson.parse<EnrollJobPayload>(job.payload)
            } catch {
                // If payload is not parseable, skip to avoid a tight requeue loop.
                continue
            }

            // Only requeue if it is actually stale by config (Interval is fixed; threshold is configurable).
            // `getStalledJobs` already enforces this via envConfig().job.stalled.
            await this.enqueueEnrollJobService.enqueue(
                {
                    jobId: job.id,
                    transactionId: payload.transactionId,
                    userId: payload.userId,
                    courseId: payload.courseId,
                },
            )
        }
    }
}

