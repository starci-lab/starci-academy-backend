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
    GeneratePersonalProjectMilestonesPayload,
    bullData,
} from "@modules/bullmq"
import {
    GenerateMilestonesStepMappingService,
} from "./step-mapping.service"

/**
 * Generate milestones: `generate-milestones` → `complete`.
 */
@Worker(
    bullData[BullQueueName.GeneratePersonalProjectMilestones].name,
    {
        concurrency: envConfig().bullmq.concurrency,
        lockDuration: envConfig().bullmq.lockDuration,
        stalledInterval: envConfig().bullmq.stalledInterval,
        maxStalledCount: envConfig().bullmq.maxStalledCount,
    },
)
export class GeneratePersonalProjectMilestonesWorker extends WorkerHost {
    constructor(
        private readonly jobActionService: JobActionService,
        @InjectSuperJson()
        private readonly superJson: SuperJSON,
        private readonly stepMappingService: GenerateMilestonesStepMappingService,
        private readonly winstonService: WinstonService,
        private readonly dayjsService: DayjsService,
    ) {
        super()
    }

    /**
     * Process the job.
     */
    async process(
        bullmqJob: Job<string>,
    ): Promise<void> {
        const startedAt = this.dayjsService.now()
        let payload: GeneratePersonalProjectMilestonesPayload | undefined
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
                    emitChangeEvent: false,
                }
            )
            payload = this.superJson.parse<GeneratePersonalProjectMilestonesPayload>(bullmqJob.data)
            const stepMap = this.stepMappingService.getStepMap()
            const context: JobExtendedContext<GeneratePersonalProjectMilestonesPayload, EmptyObject> = {
                job,
                queueName: bullmqJob.queueName,
                payload,
                extended: {
                },
            }
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
                    emitChangeEvent: false,
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
