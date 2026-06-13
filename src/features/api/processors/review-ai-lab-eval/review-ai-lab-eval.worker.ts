import {
    JobActionService,
    JobExtendedContext,
} from "@modules/bussiness"
import {
    DayjsService,
} from "@modules/mixin"
import {
    envConfig,
} from "@modules/env"
import {
    InjectSuperJson,
} from "@modules/mixin"
import {
    Processor as Worker,
    WorkerHost,
} from "@nestjs/bullmq"
import {
    Job,
} from "bullmq"
import {
    JobEntity,
} from "@modules/databases"
import {
    EmptyObject,
} from "@modules/common"
import SuperJSON from "superjson"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import {
    BullQueueName,
    ReviewAiLabEvalPayload,
    bullData,
} from "@modules/bullmq"
import {
    ReviewAiLabEvalStepMappingService,
} from "./step-mapping.service"

/**
 * AI Lab eval-runner worker: `grade` → `complete`.
 *
 * Mirrors {@link ReviewMilestoneTaskWorker}: it loads the persisted job row,
 * marks it processing, parses the {@link ReviewAiLabEvalPayload}, then drives
 * each mapped step in order until the job's steps are exhausted, finally marking
 * the job complete (which emits the job-status event the FE socket relays).
 */
@Worker(
    bullData[BullQueueName.ReviewAiLabEval].name,
    {
        concurrency: envConfig().bullmq.concurrency,
        lockDuration: envConfig().bullmq.lockDuration,
        stalledInterval: envConfig().bullmq.stalledInterval,
        maxStalledCount: envConfig().bullmq.maxStalledCount,
    },
)
export class ReviewAiLabEvalWorker extends WorkerHost {
    constructor(
        private readonly jobActionService: JobActionService,
        @InjectSuperJson()
        private readonly superJson: SuperJSON,
        private readonly stepMappingService: ReviewAiLabEvalStepMappingService,
        private readonly winstonService: WinstonService,
        private readonly dayjsService: DayjsService,
    ) {
        super()
    }

    /**
     * Process the job.
     * @param bullmqJob - The raw BullMQ job whose data is the serialized payload.
     * @returns A promise that resolves once every step has run.
     */
    async process(
        bullmqJob: Job<string>,
    ): Promise<void> {
        const startedAt = this.dayjsService.now()
        let payload: ReviewAiLabEvalPayload | undefined
        let job: JobEntity | undefined
        try {
            job = await this.jobActionService.getJob(
                {
                    id: bullmqJob.id ?? "",
                }
            )
            await this.jobActionService.processingJob(
                {
                    job,
                }
            )
            payload = this.superJson.parse<ReviewAiLabEvalPayload>(bullmqJob.data)
            const stepMap = this.stepMappingService.getStepMap()
            const context: JobExtendedContext<ReviewAiLabEvalPayload, EmptyObject> = {
                job,
                queueName: bullmqJob.queueName,
                payload,
                extended: {
                },
            }
            // drive each mapped step until the job's currentStep reaches maxSteps
            while (job.currentStep < job.maxSteps) {
                const syncedJob = await this.jobActionService.getJob(
                    {
                        id: job.id,
                    }
                )
                job = syncedJob
                context.job = job
                await stepMap.get(
                    syncedJob.currentStep
                )?.process(
                    context
                )
            }
            await this.jobActionService.completeJob(
                {
                    job,
                }
            )
            this.winstonService.log(
                WinstonLog.JobExecutedSuccessfully,
                {
                    jobId: job.id ?? "",
                    queueName: bullmqJob.queueName,
                    payload,
                    durationMs: this.dayjsService.now().diff(
                        this.dayjsService.from(
                            startedAt
                        )
                    ),
                }
            )
        } catch (error) {
            this.winstonService.log(
                WinstonLog.JobExecutedFailed,
                {
                    jobId: job?.id ?? "",
                    queueName: bullmqJob.queueName,
                    payload,
                    error: error.message,
                    durationMs: this.dayjsService.now().diff(
                        this.dayjsService.from(
                            startedAt
                        )
                    ),
                }
            )
            throw error
        }
    }
}
