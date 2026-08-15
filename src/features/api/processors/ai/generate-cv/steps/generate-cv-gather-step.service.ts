import type {
    GenerateCvPayload,
} from "@modules/integrations/bullmq/types/payloads/generate-cv"
import {
    JobActionService,
} from "@modules/bussiness/jobs/atomic/job-action.service"
import {
    AbstractStepService,
    JobExtendedContext,
} from "@modules/bussiness/jobs/types/context"
import {
    UserCvGenerationEntity,
} from "@modules/databases/postgresql/primary/entities/user-cv-generation.entity"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    CvGenerationMode,
} from "@modules/databases/postgresql/primary/enums/cv-generation-mode"
import {
    CvSource,
} from "@modules/databases/postgresql/primary/enums/cv-source"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    S3Provider,
} from "@modules/integrations/s3/enums/s3"
import {
    S3ReadService,
} from "@modules/integrations/s3/s3-read.service"
import {
    Injectable,
} from "@nestjs/common"
import {
    type EntityManager,
} from "typeorm"
import {
    WinstonLog,
} from "@modules/platform/winston/enums/winston-log"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import type {
    GatheredUserProfile,
    GenerateCvGatherStepExecuteResult,
} from "../types/execute"
import type {
    ExtendedGenerateCvContext,
} from "../types/extended"
import {
    extractCvText,
} from "./extract-cv-text"

@Injectable()
/**
 * Step 0 -- gather. Loads the learner profile and consumes the immutable capstone
 * snapshot selected before enqueue. It deliberately does not infer CV claims from
 * challenges, coding solves or XP. In `Revise` mode it also resolves the owned
 * source CV text. The gathered result is persisted for the compose step.
 */
export class GenerateCvGatherStepService extends AbstractStepService<
    GenerateCvPayload,
    ExtendedGenerateCvContext
> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly jobActionService: JobActionService,
        private readonly winstonService: WinstonService,
        private readonly s3ReadService: S3ReadService,
    ) {
        super()
    }

    stepIndex = 0
    stepName = "gather"

    /**
     * Process the gather step.
     */
    async process(
        context: JobExtendedContext<
            GenerateCvPayload,
            ExtendedGenerateCvContext
        >,
    ): Promise<void> {
        try {
            const executionResult = await this.execute(context)
            await this.finalize(executionResult,
                context)
        } catch (error) {
            await this.jobActionService.failJob(
                {
                    job: context.job,
                    error: error.message,
                },
            )
            throw error
        }
    }

    /**
     * Execute: load profile/source text and carry the frozen selected evidence.
     */
    private async execute(
        context: JobExtendedContext<
            GenerateCvPayload,
            ExtendedGenerateCvContext
        >,
    ): Promise<GenerateCvGatherStepExecuteResult> {
        const { payload } = context
        const { userId } = payload

        // The profile and optional source CV are independent reads.
        const [profile,
            sourceCvText] = await Promise.all([
            this.gatherProfile(userId),
            this.gatherSourceCvText(payload),
        ])

        return {
            profile,
            selectedEvidence: payload.selectedEvidence,
            sourceCvText,
        }
    }

    /**
     * Verified profile fields for the CV header/contact block.
     */
    private async gatherProfile(
        userId: string,
    ): Promise<GatheredUserProfile> {
        const user = await this.entityManager.findOneOrFail(
            UserEntity,
            {
                where: {
                    id: userId,
                },
                select: {
                    id: true,
                    displayName: true,
                    bio: true,
                    roleTitle: true,
                    location: true,
                    linkedinUrl: true,
                    websiteUrl: true,
                    githubUsername: true,
                    workMode: true,
                    openToWork: true,
                },
            },
        )
        return {
            displayName: user.displayName,
            bio: user.bio,
            roleTitle: user.roleTitle,
            location: user.location,
            linkedinUrl: user.linkedinUrl,
            websiteUrl: user.websiteUrl,
            githubUsername: user.githubUsername,
            workMode: user.workMode,
            openToWork: user.openToWork,
        }
    }

    /**
     * `Revise` mode: resolve the source `cv_generations` row (`sourceCvSubmissionId`
     * -- unified table, covers both `Uploaded` and `Generated` sources) and
     * produce text for the compose prompt: buffer + extract the file for
     * `Uploaded`, or serialize the already-assembled `structuredData` for
     * `Generated`. Non-Revise, missing source id, or missing source material ->
     * `null` (compose then behaves like Generate).
     */
    private async gatherSourceCvText(
        payload: GenerateCvPayload,
    ): Promise<string | null> {
        if (payload.mode !== CvGenerationMode.Revise || !payload.sourceCvSubmissionId) {
            return null
        }
        const source = await this.entityManager.findOne(
            UserCvGenerationEntity,
            {
                where: {
                    id: payload.sourceCvSubmissionId,
                },
                select: {
                    id: true,
                    source: true,
                    uploadedCdnKey: true,
                    structuredData: true,
                },
            },
        )
        if (!source) {
            return null
        }
        if (source.source === CvSource.Uploaded) {
            const key = source.uploadedCdnKey
            if (!key) {
                return null
            }
            const buffer = await this.s3ReadService.buffer({
                key,
                provider: S3Provider.Minio,
            })
            if (!buffer || buffer.length === 0) {
                return null
            }
            const text = await extractCvText({
                buffer,
                key,
            })
            return text.length > 0 ? text : null
        }
        return source.structuredData
            ? JSON.stringify(
                source.structuredData,
                null,
                2,
            )
            : null
    }

    /**
     * Persist the gathered blob as this step's execution result + advance the step.
     */
    private async finalize(
        executionResult: GenerateCvGatherStepExecuteResult,
        context: JobExtendedContext<
            GenerateCvPayload,
            ExtendedGenerateCvContext
        >,
    ): Promise<void> {
        const {
            job,
            payload,
            queueName,
        } = context
        await this.entityManager.transaction(
            async (entityManager) => {
                await this.jobActionService.increaseJob(
                    {
                        job,
                        entityManager,
                    },
                )
                await this.jobActionService.saveExecutionResult(
                    {
                        job,
                        key: this.stepName,
                        executionResult,
                        entityManager,
                    },
                )
            },
        )
        this.winstonService.log(
            WinstonLog.ProcessCVSubmissionStepExecuted,
            {
                jobId: job.id ?? "",
                queueName,
                step: this.stepName,
                stepIndex: this.stepIndex,
                payload,
                success: true,
            },
        )
    }
}
