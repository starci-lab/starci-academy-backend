import {
    BullQueueName,
    ProccessGitUrlPayload,
    bullData,
} from "@modules/bullmq"
import {
    envConfig,
} from "@modules/env"
import {
    JobActionService,
} from "@modules/bussiness"
import {
    DayjsService,
    InjectSuperJson,
} from "@modules/mixin"
import {
    Processor as Worker,
    WorkerHost,
} from "@nestjs/bullmq"
import {
    Job,
} from "bullmq"
import SuperJSON from "superjson"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import {
    ProccessGitUrlStepMappingService,
} from "./step-mapping.service"
import type {
    ProccessGitUrlPipelineContext,
} from "./types"

/**
 * Worker: resolve DB (submission URL + prompts) → clone repo → split → embed → grade with Gemini → update `user_challenge_submissions`.
 * Enqueued jobs must use `maxSteps: 5`.
 */
@Worker(
    bullData[BullQueueName.ProccessGitUrl].name,
    {
        concurrency: envConfig().bullmq.concurrency,
        lockDuration: envConfig().bullmq.lockDuration,
        stalledInterval: envConfig().bullmq.stalledInterval,
        maxStalledCount: envConfig().bullmq.maxStalledCount,
    },
)
export class ProccessGitUrlWorker extends WorkerHost {
    constructor(
        private readonly jobActionService: JobActionService,
        @InjectSuperJson()
        private readonly superJson: SuperJSON,
        private readonly stepMappingService: ProccessGitUrlStepMappingService,
        private readonly winstonService: WinstonService,
        private readonly dayjsService: DayjsService,
    ) {
        super()
    }

    /**
     * Process the BullMQ job: run each pipeline step until `currentStep` reaches `maxSteps`.
     * @param bullmqJob - The BullMQ job.
     */
    async process(bullmqJob: Job<string>) {
        const startedAt = this.dayjsService.now()
        let payload: ProccessGitUrlPayload | undefined
        let jobId = ""
        try {
            payload = this.superJson.parse<ProccessGitUrlPayload>(bullmqJob.data)
            const stepMap = this.stepMappingService.getStepMap()
            const job = await this.jobActionService.getJob(
                {
                    id: payload.jobId,
                },
            )
            jobId = job.id ?? ""
            const context: ProccessGitUrlPipelineContext = {
                job,
                queueName: bullmqJob.queueName,
                payload,
            }
            while (job.currentStep < job.maxSteps) {
                await stepMap.get(job.currentStep)?.process(
                    context,
                )
            }
            this.winstonService.log(
                WinstonLog.JobExecutedSuccessfully,
                {
                    jobId,
                    queueName: bullmqJob.queueName,
                    payload,
                    durationMs: this.dayjsService.now().diff(this.dayjsService.from(startedAt)),
                },
            )
        } catch (error) {
            this.winstonService.log(
                WinstonLog.JobExecutedFailed,
                {
                    jobId: jobId || (bullmqJob.id ?? ""),
                    queueName: bullmqJob.queueName,
                    payload,
                    error: error instanceof Error ? error.message : String(error),
                    durationMs: this.dayjsService.now().diff(this.dayjsService.from(startedAt)),
                },
            )
            if (payload?.jobId) {
                try {
                    const job = await this.jobActionService.getJob(
                        {
                            id: payload.jobId,
                        },
                    )
                    await this.jobActionService.failJob(
                        {
                            job,
                            error: error instanceof Error ? error.message : "Unknown error",
                        },
                    )
                } catch {
                    // job record missing or already failed
                }
            }
            throw error
        }
    }
}
