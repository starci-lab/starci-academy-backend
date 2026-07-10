import type {
    GenerateCvPayload,
} from "@modules/bullmq"
import {
    JobActionService,
    JobExtendedContext,
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
    envConfig,
} from "@modules/env"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import {
    GenerateCvStepMappingService,
} from "./step-mapping.service"
import type {
    ExtendedGenerateCvContext,
} from "./types"
import {
    CvGenerationStatus,
    InjectPrimaryPostgreSQLEntityManager,
    JobEntity,
    UserCvGenerationEntity,
} from "@modules/databases"
import {
    EntityManager,
} from "typeorm"
import {
    CvGenerationNotFoundException,
    StepNotFoundException,
} from "@modules/exceptions"

// TODO(wire): replace the queue-name literal below with
// `bullData[BullQueueName.GenerateCv].name` once `BullQueueName.GenerateCv` +
// its bullData entry are added (steps 1 & 2 above). Using the literal
// "generate-cv" keeps this file compiling without touching the shared enum.
const GENERATE_CV_QUEUE_NAME = "generate-cv"

/**
 * Generate-CV worker: gather verified achievements → compose structured CV via
 * LLM → render LaTeX + upload → score (shared rubric) → complete (persist onto
 * `cv_generations`). Runs the shared 5-step {@link AbstractStepService} pipeline;
 * `maxSteps` is `5`.
 */
@Worker(
    GENERATE_CV_QUEUE_NAME,
    {
        concurrency: envConfig().bullmq.aiConcurrency,
        lockDuration: envConfig().bullmq.lockDuration,
        stalledInterval: envConfig().bullmq.stalledInterval,
        maxStalledCount: envConfig().bullmq.maxStalledCount,
    },
)
export class GenerateCvWorker extends WorkerHost {
    constructor(
        private readonly jobActionService: JobActionService,
        @InjectSuperJson()
        private readonly superJson: SuperJSON,
        private readonly stepMappingService: GenerateCvStepMappingService,
        private readonly winstonService: WinstonService,
        private readonly dayjsService: DayjsService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {
        super()
    }

    /**
     * Process the job.
     * @param bullmqJob - The bullmq job.
     * @returns A promise that resolves when the job is processed.
     */
    async process(bullmqJob: Job<string>) {
        const startedAt = this.dayjsService.now()
        let payload: GenerateCvPayload | undefined
        let job: JobEntity | undefined
        try {
            job = await this.jobActionService.getJob(
                {
                    id: bullmqJob.id ?? "",
                },
            )
            await this.jobActionService.processingJob({
                job,
            })
            payload = this.superJson.parse<GenerateCvPayload>(bullmqJob.data)
            const stepMap = this.stepMappingService.getStepMap()
            // load the Pending generation row (created at enqueue time) WITH its
            // owner so the render step can read verified contact fields.
            const cvGeneration = await this.entityManager.findOne(
                UserCvGenerationEntity,
                {
                    where: {
                        id: payload.cvGenerationId,
                    },
                    relations: {
                        user: true,
                    },
                },
            )
            if (!cvGeneration) {
                throw new CvGenerationNotFoundException({
                    cvGenerationId: payload.cvGenerationId,
                })
            }
            const context: JobExtendedContext<
            GenerateCvPayload,
            ExtendedGenerateCvContext
            > = {
                job,
                queueName: bullmqJob.queueName,
                payload,
                extended: {
                    cvGeneration,
                },
            }
            while (job.currentStep < job.maxSteps) {
                const syncedJob = await this.jobActionService.getJob(
                    {
                        id: job.id,
                    },
                )
                job = syncedJob
                context.job = job
                const step = stepMap.get(syncedJob.currentStep)
                if (!step) {
                    throw new StepNotFoundException({
                        stepIndex: syncedJob.currentStep,
                    })
                }
                await step.process(context)
            }
            await this.jobActionService.completeJob({
                job,
            })
            this.winstonService.log(
                WinstonLog.JobExecutedSuccessfully,
                {
                    jobId: job.id ?? "",
                    queueName: bullmqJob.queueName,
                    payload,
                    durationMs: this.dayjsService.now().diff(this.dayjsService.from(startedAt)),
                },
            )
        } catch (error) {
            // best-effort: mark the generation Failed so the FE stops polling.
            if (payload?.cvGenerationId) {
                await this.markGenerationFailed(
                    payload.cvGenerationId,
                    error instanceof Error ? error.message : String(error),
                )
            }
            this.winstonService.log(
                WinstonLog.JobExecutedFailed,
                {
                    jobId: job?.id ?? "",
                    queueName: bullmqJob.queueName,
                    payload,
                    error: error.message,
                    durationMs: this.dayjsService.now().diff(this.dayjsService.from(startedAt)),
                },
            )
            throw error
        }
    }

    /**
     * Mark the generation row `Failed` with the error message (best-effort — a
     * failure to write this must not mask the original error).
     */
    private async markGenerationFailed(
        cvGenerationId: string,
        errorMessage: string,
    ): Promise<void> {
        try {
            await this.entityManager.update(
                UserCvGenerationEntity,
                {
                    id: cvGenerationId,
                },
                {
                    status: CvGenerationStatus.Failed,
                    errorMessage,
                    processedAt: this.dayjsService.now().toDate(),
                },
            )
        } catch {
            // swallow — the thrown original error is what matters
        }
    }
}
