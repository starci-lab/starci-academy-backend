// ============================================================================
//   This service is a provider of `GenerateCvModule` and is EXPORTED there,
//   so the GraphQL CV-generation mutation module can inject it after
//   importing the (globally-registered) `GenerateCvModule`.
//   PUBLIC ENTRYPOINT for the GraphQL mutation agent:
//     class  EnqueueGenerateCvJobService
//     method async enqueue(params: EnqueueGenerateCvJobParams): Promise<UserCvGenerationEntity>
// ============================================================================

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
    bullData,
} from "@modules/integrations/bullmq/constants/queue"
import {
    BullQueueName,
} from "@modules/integrations/bullmq/enums/queue-name"
import {
    v4 as uuidv4,
} from "uuid"
import SuperJSON from "superjson"
import {
    InjectSuperJson,
} from "@modules/lib/mixin/superjson.providers"
import {
    UserCvGenerationEntity,
} from "@modules/databases/postgresql/primary/entities/user-cv-generation.entity"
import {
    ActionType,
} from "@modules/databases/postgresql/primary/enums/action-type"
import {
    CvGenerationMode,
} from "@modules/databases/postgresql/primary/enums/cv-generation-mode"
import {
    CvGenerationStatus,
} from "@modules/databases/postgresql/primary/enums/cv-generation-status"
import {
    CvSource,
} from "@modules/databases/postgresql/primary/enums/cv-source"
import {
    JobCategory,
} from "@modules/databases/postgresql/primary/enums/job-category"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    CvTargetLevel,
} from "@modules/databases/postgresql/primary/enums/cv-target-level"
import type {
    CvEvidenceSnapshot,
} from "@modules/databases/postgresql/primary/types/cv-evidence-snapshot"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    EntityManager,
} from "typeorm"
import {
    JobActionService,
} from "@modules/bussiness/jobs/atomic/job-action.service"
import {
    envConfig,
} from "@modules/platform/env/config"
import type {
    GenerateCvPayload,
} from "@modules/integrations/bullmq/types/payloads/generate-cv"
import type {
    AiJobSelection,
} from "@modules/ai/types/ai-job-selection"
import {
    sleepEnqueueUxDelay,
} from "@modules/bussiness/jobs/utils/enqueue-ux-delay"

/** Parameters for {@link EnqueueGenerateCvJobService.enqueue}. */
export interface EnqueueGenerateCvJobParams {
    /** `users.id` -- owner of the generation run. */
    userId: string
    /** Build a new CV or revise an existing submission. */
    mode: CvGenerationMode
    /** `cv_submissions.id` to revise (required when `mode` = Revise). */
    sourceCvSubmissionId?: string
    /** User's free-text emphasis / target-role notes. */
    extraPrompts?: string
    /** Effective output language, resolved before enqueue. */
    language: Locale
    /** Validated AI lane + model pick (Auto / Premium / BYOK). */
    ai?: AiJobSelection
    /** Optional course/track to tie the created CV row to (`courses.id`). */
    courseId?: string
    /** Optional user-facing name for the created CV row. */
    label?: string
    /** Optional target role the CV is aimed at (free-text). */
    targetRole?: string
    /** Explicit seniority bar for compose and score. */
    targetLevel: CvTargetLevel
    /** Immutable selected-capstone snapshot. */
    selectedEvidence: CvEvidenceSnapshot
}

/** Result of {@link EnqueueGenerateCvJobService.enqueue}. */
export interface EnqueueGenerateCvJobResult {
    /** The created `cv_generations` row (status `Pending`). */
    cvGeneration: UserCvGenerationEntity
    /** The tracked `jobs.id`, used to subscribe to realtime progress over the `job_notifications` socket. */
    jobId: string
}

@Injectable()
/**
 * Enqueues a CV generation job. CREATES the `Pending` {@link UserCvGenerationEntity}
 * row FIRST (in the same order as the git/google-docs enqueue services create
 * their tracked rows), then creates the tracked `jobs` row and adds the BullMQ
 * job. The worker updates the generation row to `Done` / `Failed`.
 */
export class EnqueueGenerateCvJobService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly jobActionService: JobActionService,
        @InjectSuperJson()
        private readonly superJson: SuperJSON,
        @InjectQueue(bullData[BullQueueName.GenerateCv].name)
        private readonly generateCvQueue: Queue<string>,
    ) {}

    /**
     * Create the Pending generation row, persist the tracked job, then enqueue.
     *
     * @param params - {@link EnqueueGenerateCvJobParams}
     * @returns The created `cv_generations` row (status `Pending`) + the tracked
     * `jobs.id` -- callers need BOTH: `cvGenerationId` to poll/display the result,
     * `jobId` to subscribe to realtime progress over the `job_notifications` socket
     * (the FE's `subscribeJob` call needs this; it is NOT derivable from
     * `cvGenerationId` -- the two ids are unrelated UUIDs on separate tables).
     */
    async enqueue(
        {
            userId,
            mode,
            sourceCvSubmissionId,
            extraPrompts,
            language,
            ai,
            courseId,
            label,
            targetRole,
            targetLevel,
            selectedEvidence,
        }: EnqueueGenerateCvJobParams,
    ): Promise<EnqueueGenerateCvJobResult> {
        const jobId = uuidv4()
        const committed = await this.entityManager.transaction(async (manager) => {
            const cvGeneration = await manager.save(
                UserCvGenerationEntity,
                manager.create(UserCvGenerationEntity,
                    {
                        user: {
                            id: userId,
                        },
                        mode,
                        source: CvSource.Generated,
                        status: CvGenerationStatus.Pending,
                        sourceCvSubmissionId: sourceCvSubmissionId ?? null,
                        extraPrompts: extraPrompts ?? null,
                        course: courseId ? {
                            id: courseId,
                        } : null,
                        label: label ?? null,
                        targetRole: targetRole ?? null,
                        language,
                        targetLevel,
                        selectedEvidence,
                    }),
            )
            const payloadBody: GenerateCvPayload = {
                jobId,
                cvGenerationId: cvGeneration.id,
                userId,
                mode,
                language,
                targetLevel,
                selectedEvidence,
                ...(targetRole !== undefined ? {
                    targetRole,
                } : {
                }),
                ...(sourceCvSubmissionId !== undefined ? {
                    sourceCvSubmissionId,
                } : {
                }),
                ...(extraPrompts !== undefined ? {
                    extraPrompts,
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
                actionType: ActionType.ProcessCvSubmission,
                category: JobCategory.ReviewCv,
                maxSteps: envConfig().job.processCvSubmission.maxSteps,
                payload: this.superJson.stringify(payloadBody),
                entityManager: manager,
            })
            return {
                cvGeneration,
                job,
            }
        })
        const { cvGeneration, job } = committed

        // 3) enqueue after the standard UX delay; on broker failure, fail the job
        // AND mark the generation row Failed so the FE stops polling.
        void sleepEnqueueUxDelay().then(() =>
            this.generateCvQueue.add(
                job.id,
                job.payload,
                {
                    jobId: job.id,
                },
            ),
        ).catch(async (error) => {
            await this.jobActionService.failJob({
                job,
                error: `Failed to enqueue job to broker: ${error?.message ?? "unknown error"}`,
            })
            await this.entityManager.update(
                UserCvGenerationEntity,
                {
                    id: cvGeneration.id,
                },
                {
                    status: CvGenerationStatus.Failed,
                    errorMessage: `Failed to enqueue job to broker: ${error?.message ?? "unknown error"}`,
                },
            )
        })

        return {
            cvGeneration,
            jobId,
        }
    }
}
