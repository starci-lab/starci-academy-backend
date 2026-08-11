import {
    Injectable,
} from "@nestjs/common"
import {
    Queue,
} from "bullmq"
import {
    InjectQueue,
} from "@nestjs/bullmq"
import {
    v4 as uuidv4,
} from "uuid"
import SuperJSON from "superjson"
import {
    InjectSuperJson,
} from "@modules/lib/mixin/superjson.providers"
import {
    ActionType,
} from "@modules/databases/postgresql/primary/enums/action-type"
import {
    JobCategory,
} from "@modules/databases/postgresql/primary/enums/job-category"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    JobActionService,
} from "@modules/bussiness/jobs/atomic/job-action.service"
import {
    sleepEnqueueUxDelay,
} from "@modules/bussiness/jobs/utils/enqueue-ux-delay"
import {
    bullData,
} from "@modules/integrations/bullmq/constants/queue"
import {
    BullQueueName,
} from "@modules/integrations/bullmq/enums/queue-name"
import type {
    ScoreUploadedCvPayload,
} from "@modules/integrations/bullmq/types/payloads/score-uploaded-cv"
import type {
    AiJobSelection,
} from "@modules/ai/types/ai-job-selection"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    UserCvGenerationEntity,
} from "@modules/databases/postgresql/primary/entities/user-cv-generation.entity"
import {
    CvGenerationStatus,
} from "@modules/databases/postgresql/primary/enums/cv-generation-status"
import type {
    EntityManager,
} from "typeorm"

/** Parameters for {@link EnqueueScoreUploadedCvJobService.enqueue}. */
export interface EnqueueScoreUploadedCvJobParams {
    /**
     * `cv_generations.id` -- the ALREADY-CREATED uploaded row (`source = uploaded`,
     * `uploadedCdnKey` set, status `Pending`). Unlike the generate path, the row
     * is created by the `uploadCv` mutation handler (it owns the uploaded key +
     * customization fields), so this enqueue only builds the tracked job + queues.
     */
    cvGenerationId: string
    /** `users.id` -- owner of the uploaded CV (drives AI entitlement / lane routing). */
    userId: string
    /** Locale hint so the AI feedback is written in the learner's language. */
    locale?: Locale
    /** Validated AI lane + model pick (Auto / Premium / BYOK) for the scoring call. */
    ai?: AiJobSelection
}

@Injectable()
/**
 * Enqueues a single-step UPLOAD-scoring job (WF-07). Mirrors
 * {@link EnqueueGenerateCvJobService} but does NOT create the `cv_generations`
 * row -- the `uploadCv` mutation handler already created the uploaded row (it owns
 * `uploadedCdnKey` + `label`/`courseId?`/`targetRole?`/`language?`). This service
 * only creates the tracked `jobs` row and adds the BullMQ job; the worker buffers
 * the file, extracts text, scores via the shared rubric, and persists the grade.
 */
export class EnqueueScoreUploadedCvJobService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly jobActionService: JobActionService,
        @InjectSuperJson()
        private readonly superJson: SuperJSON,
        @InjectQueue(bullData[BullQueueName.ScoreUploadedCv].name)
        private readonly scoreUploadedCvQueue: Queue<string>,
    ) {}

    /**
     * Build the tracked job for an existing uploaded row, then enqueue it.
     *
     * @param params - {@link EnqueueScoreUploadedCvJobParams}
     * @returns The tracked `jobs.id` -- the caller returns it alongside the
     * `cvGenerationId` so the FE can subscribe to realtime scoring progress over
     * the `job_notifications` socket (the two ids are unrelated UUIDs on separate
     * tables, so `jobId` is NOT derivable from `cvGenerationId`).
     */
    async enqueue(
        {
            cvGenerationId,
            userId,
            locale,
            ai,
        }: EnqueueScoreUploadedCvJobParams,
    ): Promise<{ jobId: string }> {
        // 1) build the payload + create the tracked jobs row. Single-step
        // (score only) -- `maxSteps` is 1: this is NOT the 5-step generate
        // pipeline, just "buffer -> extract -> score -> persist" in one worker pass.
        const jobId = uuidv4()
        const payloadBody: ScoreUploadedCvPayload = {
            jobId,
            cvGenerationId,
            userId,
            ...(locale !== undefined ? {
                locale,
            } : {
            }),
            ...(ai !== undefined ? {
                ai,
            } : {
            }),
        }
        const job = await this.jobActionService.createJob({
            id: jobId,
            userId,
            // reuse the CV review action/category so the row is grouped with the
            // generate + legacy review CV jobs (one CV-job family, one shape).
            actionType: ActionType.ProcessCvSubmission,
            category: JobCategory.ReviewCv,
            // single-step: score only.
            maxSteps: 1,
            payload: this.superJson.stringify(payloadBody),
        })

        // 2) enqueue after the standard UX delay; on broker failure, fail the
        // tracked job so the FE stops polling. The `cv_generations` row is left as
        // the mutation created it (Pending) -- the worker (never reached) is what
        // would mark it Failed; a broker miss here at least surfaces on the job.
        void sleepEnqueueUxDelay().then(() =>
            this.scoreUploadedCvQueue.add(
                job.id,
                job.payload,
                {
                    jobId: job.id,
                },
            ),
        ).catch(async (error) => {
            const message = `Failed to enqueue job to broker: ${error?.message ?? "unknown error"}`
            await this.jobActionService.failJob({
                job,
                error: message,
            })
            // The mutation has already persisted this row. Leaving it Pending
            // after a broker rejection makes the UI poll forever even though no
            // worker can ever own the run, so close both durable state machines.
            await this.entityManager.update(
                UserCvGenerationEntity,
                {
                    id: cvGenerationId,
                },
                {
                    status: CvGenerationStatus.Failed,
                    errorMessage: message,
                },
            )
        })

        return {
            jobId,
        }
    }
}
