import {
    Injectable,
} from "@nestjs/common"
import {
    Interval,
} from "@nestjs/schedule"
import {
    EnqueueProcessGitSubmissionJobService,
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
    envConfig,
} from "@modules/env"
import {
    ProcessGitSubmissionPayload,
} from "@modules/bullmq"

/**
 * Periodically re-enqueues stalled jobs.
 *
 * Stalled means: still Processing and `queueAt` older than `envConfig().job.stalled`.
 */
@Injectable()
export class ProcessGoogleDocsSubmissionRequeueService {
    constructor(
        private readonly jobStalledService: JobStalledService,
        private readonly enqueueProcessGitSubmissionJobService: EnqueueProcessGitSubmissionJobService,
        @InjectSuperJson()
        private readonly superJson: SuperJSON,
    ) {}

    @Interval(
        envConfig().job.stalled.intervalMs,
    )
    async handleInterval(): Promise<void> {
        const stalledJobs = await this.jobStalledService.getStalledJobs(
            {
                actionType: ActionType.ProcessGitSubmission,
            }
        )
        if (stalledJobs.length === 0) {
            return
        }
        // Requeue the jobs.
        for (const job of stalledJobs) {
            // IMPORTANT: payload is stored as text; it's the same value passed to BullMQ.
            const payload = this.superJson.parse<ProcessGitSubmissionPayload>(job.payload)
            // Only requeue if it is actually stale by config (Interval is fixed; threshold is configurable).
            await this.enqueueProcessGitSubmissionJobService.enqueue(
                payload
            )
        }
    }
}

