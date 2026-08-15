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
import {
    CvGenerationMode,
} from "@modules/databases/postgresql/primary/enums/cv-generation-mode"
import {
    CvSource,
} from "@modules/databases/postgresql/primary/enums/cv-source"
import {
    CvTargetLevel,
} from "@modules/databases/postgresql/primary/enums/cv-target-level"
import type {
    EntityManager,
} from "typeorm"

/** Parameters for {@link EnqueueScoreUploadedCvJobService.enqueue}. */
export interface EnqueueScoreUploadedCvJobParams {
    /** `users.id` -- owner of the uploaded CV (drives AI entitlement / lane routing). */
    userId: string
    cdnKey: string
    language: Locale
    targetLevel: CvTargetLevel
    courseId?: string
    label?: string
    targetRole?: string
    /** Validated AI lane + model pick (Auto / Premium / BYOK) for the scoring call. */
    ai?: AiJobSelection
}

@Injectable()
/**
 * Enqueues a single-step UPLOAD-scoring job (WF-07). Mirrors
 * {@link EnqueueGenerateCvJobService}: it atomically creates the uploaded
 * `cv_generations` row and tracked job, then dispatches BullMQ after commit.
 * The worker buffers the file, extracts text, scores via the shared rubric, and
 * persists the grade.
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
     * Build the uploaded run and tracked job atomically, then enqueue it.
     *
     * @param params - {@link EnqueueScoreUploadedCvJobParams}
     * @returns The tracked `jobs.id` -- the caller returns it alongside the
     * `cvGenerationId` so the FE can subscribe to realtime scoring progress over
     * the `job_notifications` socket (the two ids are unrelated UUIDs on separate
     * tables, so `jobId` is NOT derivable from `cvGenerationId`).
     */
    async enqueue(
        {
            userId,
            cdnKey,
            language,
            targetLevel,
            courseId,
            label,
            targetRole,
            ai,
        }: EnqueueScoreUploadedCvJobParams,
    ): Promise<{ cvGeneration: UserCvGenerationEntity, jobId: string }> {
        const jobId = uuidv4()
        const committed = await this.entityManager.transaction(async (manager) => {
            const cvGeneration = await manager.save(
                UserCvGenerationEntity,
                manager.create(UserCvGenerationEntity,
                    {
                        user: {
                            id: userId,
                        },
                        mode: CvGenerationMode.Generate,
                        source: CvSource.Uploaded,
                        status: CvGenerationStatus.Pending,
                        uploadedCdnKey: cdnKey,
                        course: courseId ? {
                            id: courseId,
                        } : null,
                        label: label ?? null,
                        targetRole: targetRole ?? null,
                        language,
                        targetLevel,
                        selectedEvidence: [],
                    }),
            )
            const payloadBody: ScoreUploadedCvPayload = {
                jobId,
                cvGenerationId: cvGeneration.id,
                userId,
                language,
                targetLevel,
                ...(ai !== undefined ? {
                    ai,
                } : {
                }),
            }
            const job = await this.jobActionService.createJob({
                id: jobId,
                userId,
                actionType: ActionType.ProcessCvSubmission,
                category: JobCategory.ReviewCv,
                maxSteps: 1,
                payload: this.superJson.stringify(payloadBody),
                entityManager: manager,
            })
            return {
                cvGeneration,
                job,
            }
        })
        const { cvGeneration, job } = committed

        // Enqueue after commit; broker failure closes both durable state machines.
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
            await this.entityManager.update(
                UserCvGenerationEntity,
                {
                    id: cvGeneration.id,
                },
                {
                    status: CvGenerationStatus.Failed,
                    errorMessage: message,
                },
            )
        })

        return {
            cvGeneration,
            jobId,
        }
    }
}
