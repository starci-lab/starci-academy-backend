import {
    Processor as Worker,
    WorkerHost,
} from "@nestjs/bullmq"
import {
    Job,
} from "bullmq"
import SuperJSON from "superjson"
import {
    DayjsService,
    InjectSuperJson,
} from "@modules/mixin"
import {
    envConfig,
} from "@modules/env"
import {
    JobActionService,
} from "@modules/bussiness"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import {
    bullData,
    BullQueueName,
} from "@modules/bullmq"
import type {
    ScoreUploadedCvPayload,
} from "@modules/bullmq"
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
    ScoreUploadedCvService,
} from "../shared/cv-scoring"

@Worker(
    bullData[BullQueueName.ScoreUploadedCv].name,
    {
        concurrency: envConfig().bullmq.aiConcurrency,
        lockDuration: envConfig().bullmq.lockDuration,
        stalledInterval: envConfig().bullmq.stalledInterval,
        maxStalledCount: envConfig().bullmq.maxStalledCount,
    },
)
/**
 * WF-07 UPLOAD-scoring worker -- SINGLE-STEP (score only), NOT a multi-step
 * pipeline. It grades a user-UPLOADED CV row (`cv_generations.source = uploaded`)
 * that already exists (created by the `uploadCv` mutation): it delegates the
 * whole "buffer `uploadedCdnKey` -> extract text -> score via the SHARED
 * {@link ScoreUploadedCvService} -> persist" to {@link ScoreUploadedCvService}, then
 * marks the row `Done`. On any failure the row is marked `Failed` so the FE stops
 * polling. This is the upload analogue of {@link GenerateCvWorker}, collapsed to a
 * single pass (there is nothing to compose/render for an already-uploaded file).
 */
export class ScoreUploadedCvWorker extends WorkerHost {
    constructor(
        private readonly jobActionService: JobActionService,
        @InjectSuperJson()
        private readonly superJson: SuperJSON,
        private readonly winstonService: WinstonService,
        private readonly dayjsService: DayjsService,
        private readonly scoreUploadedCvService: ScoreUploadedCvService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {
        super()
    }

    /**
     * Process one uploaded-CV scoring job.
     * @param bullmqJob - The raw BullMQ job whose `data` is the serialized payload.
     * @returns Resolves when the row has been graded (Done) or marked Failed.
     */
    async process(bullmqJob: Job<string>): Promise<void> {
        const startedAt = this.dayjsService.now()
        let payload: ScoreUploadedCvPayload | undefined
        let job: JobEntity | undefined
        try {
            // load + claim the tracked job (mark processing, bump fencing token).
            job = await this.jobActionService.getJob({
                id: bullmqJob.id ?? "",
            })
            await this.jobActionService.processingJob({
                job,
            })
            payload = this.superJson.parse<ScoreUploadedCvPayload>(bullmqJob.data)

            // single step: delegate buffer -> extract -> score -> persist to the
            // shared service (the SAME CvScoringService the generate path uses).
            await this.scoreUploadedCvService.scoreUploadedCv({
                cvGenerationId: payload.cvGenerationId,
                userId: payload.userId,
                ...(payload.locale !== undefined ? {
                    locale: payload.locale,
                } : {
                }),
                ...(payload.ai !== undefined ? {
                    selection: payload.ai,
                } : {
                }),
            })

            // mark the uploaded row Done (score + feedback were written by the
            // shared service above) + complete the tracked job.
            await this.entityManager.update(
                UserCvGenerationEntity,
                {
                    id: payload.cvGenerationId,
                },
                {
                    status: CvGenerationStatus.Done,
                    errorMessage: null,
                    processedAt: this.dayjsService.now().toDate(),
                },
            )
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
            // best-effort: mark the uploaded row Failed so the FE stops polling,
            // then fail the tracked job + rethrow (BullMQ records the failure).
            if (payload?.cvGenerationId) {
                await this.markGenerationFailed(
                    payload.cvGenerationId,
                    error instanceof Error ? error.message : String(error),
                )
            }
            if (job) {
                await this.jobActionService.failJob({
                    job,
                    error: error instanceof Error ? error.message : String(error),
                })
            }
            this.winstonService.log(
                WinstonLog.JobExecutedFailed,
                {
                    jobId: job?.id ?? "",
                    queueName: bullmqJob.queueName,
                    payload,
                    error: error instanceof Error ? error.message : String(error),
                    durationMs: this.dayjsService.now().diff(this.dayjsService.from(startedAt)),
                },
            )
            throw error
        }
    }

    /**
     * Mark the uploaded generation row `Failed` with the error message
     * (best-effort -- a failure to write this must not mask the original error).
     * @param cvGenerationId - The `cv_generations.id` to fail.
     * @param errorMessage - The failure reason to persist.
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
            // swallow -- the thrown original error is what matters
        }
    }
}
