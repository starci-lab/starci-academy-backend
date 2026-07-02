// ============================================================================
// WIRING TODO (final wire step):
//   1. After `BullQueueName.GenerateCv` + its `bullData` entry are added (see
//      generate-cv.worker.ts TODO), change the `@InjectQueue("generate-cv")`
//      below to `@InjectQueue(bullData[BullQueueName.GenerateCv].name)` and
//      import `bullData, BullQueueName` from "@modules/bullmq".
//   2. This service is a provider of `GenerateCvModule` and is EXPORTED there,
//      so the GraphQL CV-generation mutation module can inject it after
//      importing the (globally-registered) `GenerateCvModule`.
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
    v4 as uuidv4,
} from "uuid"
import SuperJSON from "superjson"
import {
    InjectSuperJson,
} from "@modules/mixin"
import {
    ActionType,
    CvGenerationMode,
    CvGenerationStatus,
    InjectPrimaryPostgreSQLEntityManager,
    JobCategory,
    Locale,
    UserCvGenerationEntity,
} from "@modules/databases"
import {
    EntityManager,
} from "typeorm"
import {
    JobActionService,
} from "@modules/bussiness"
import {
    envConfig,
} from "@modules/env"
import type {
    GenerateCvPayload,
} from "@modules/bullmq"
import type {
    AiJobSelection,
} from "@modules/ai"
import {
    sleepEnqueueUxDelay,
} from "@modules/bussiness"

/** Parameters for {@link EnqueueGenerateCvJobService.enqueue}. */
export interface EnqueueGenerateCvJobParams {
    /** `users.id` — owner of the generation run. */
    userId: string
    /** Build a new CV or revise an existing submission. */
    mode: CvGenerationMode
    /** `cv_submissions.id` to revise (required when `mode` = Revise). */
    sourceCvSubmissionId?: string
    /** User's free-text emphasis / target-role notes. */
    extraPrompts?: string
    /** Locale hint for prompting (e.g. "en", "vi"). */
    locale?: Locale
    /** Validated AI lane + model pick (Auto / Premium / BYOK). */
    ai?: AiJobSelection
}

/**
 * Enqueues a CV generation job. CREATES the `Pending` {@link UserCvGenerationEntity}
 * row FIRST (in the same order as the git/google-docs enqueue services create
 * their tracked rows), then creates the tracked `jobs` row and adds the BullMQ
 * job. The worker updates the generation row to `Done` / `Failed`.
 */
@Injectable()
export class EnqueueGenerateCvJobService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly jobActionService: JobActionService,
        @InjectSuperJson()
        private readonly superJson: SuperJSON,
        // TODO(wire): swap the literal for
        // `@InjectQueue(bullData[BullQueueName.GenerateCv].name)`.
        @InjectQueue("generate-cv")
        private readonly generateCvQueue: Queue<string>,
    ) {}

    /**
     * Create the Pending generation row, persist the tracked job, then enqueue.
     *
     * @param params - {@link EnqueueGenerateCvJobParams}
     * @returns The created `cv_generations` row (status `Pending`).
     */
    async enqueue(
        {
            userId,
            mode,
            sourceCvSubmissionId,
            extraPrompts,
            locale,
            ai,
        }: EnqueueGenerateCvJobParams,
    ): Promise<UserCvGenerationEntity> {
        // 1) create the Pending generation row FIRST — the worker/steps update it.
        const cvGeneration = await this.entityManager.save(
            UserCvGenerationEntity,
            this.entityManager.create(
                UserCvGenerationEntity,
                {
                    user: {
                        id: userId,
                    },
                    mode,
                    status: CvGenerationStatus.Pending,
                    sourceCvSubmissionId: sourceCvSubmissionId ?? null,
                    extraPrompts: extraPrompts ?? null,
                },
            ),
        )

        // 2) build the payload + create the tracked jobs row.
        const jobId = uuidv4()
        const payloadBody: GenerateCvPayload = {
            jobId,
            cvGenerationId: cvGeneration.id,
            userId,
            mode,
            ...(sourceCvSubmissionId !== undefined ? {
                sourceCvSubmissionId,
            } : {
            }),
            ...(extraPrompts !== undefined ? {
                extraPrompts,
            } : {
            }),
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
            actionType: ActionType.ProcessCvSubmission,
            category: JobCategory.ReviewCv,
            // reuse the existing 4-step CV job config (default 4).
            maxSteps: envConfig().job.processCvSubmission.maxSteps,
            payload: this.superJson.stringify(payloadBody),
        })

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

        return cvGeneration
    }
}
