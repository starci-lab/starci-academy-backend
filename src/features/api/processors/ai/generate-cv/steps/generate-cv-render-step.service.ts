import type {
    GenerateCvPayload,
} from "@modules/bullmq"
import {
    JobActionService,
    AbstractStepService,
    JobExtendedContext,
} from "@modules/bussiness"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import {
    S3Provider,
    S3UploadService,
} from "@modules/s3"
import {
    Injectable,
} from "@nestjs/common"
import {
    type EntityManager,
} from "typeorm"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import type {
    ExtendedGenerateCvContext,
    GenerateCvComposeStepExecuteResult,
    GenerateCvRenderStepExecuteResult,
} from "../types"
import {
    renderCvLatex,
} from "./latex"

/**
 * Step 2 — render. Reads the structured CV JSON from the compose step, fills the
 * LaTeX template (every user-supplied value is LaTeX-escaped inside the
 * template's `tex` helper), and uploads the `.tex` document to MinIO under
 * `cv-generations/{userId}/{jobId}.tex`. The object key is persisted as this
 * step's execution result for the complete step to copy onto the entity.
 */
@Injectable()
export class GenerateCvRenderStepService extends AbstractStepService<
    GenerateCvPayload,
    ExtendedGenerateCvContext
> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly jobActionService: JobActionService,
        private readonly winstonService: WinstonService,
        private readonly s3UploadService: S3UploadService,
    ) {
        super()
    }

    stepIndex = 2
    stepName = "render"

    /**
     * Process the render step.
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
     * Execute: render the `.tex` from structured data + upload to MinIO.
     */
    private async execute(
        context: JobExtendedContext<
            GenerateCvPayload,
            ExtendedGenerateCvContext
        >,
    ): Promise<GenerateCvRenderStepExecuteResult> {
        const { payload, job } = context

        const composed = await this.jobActionService.loadExecutionResult<
            GenerateCvComposeStepExecuteResult
        >({
            job,
            key: "compose",
        })
        if (!composed) {
            throw new Error("Missing compose execution result for CV render step")
        }

        // header contact fields come from the profile the compose step already
        // folded into the structured data; contact specifics (phone/email) are
        // not verified fields here, so leave them blank when absent.
        const cvGeneration = context.extended?.cvGeneration
        const githubUsername = cvGeneration?.user?.githubUsername ?? ""

        const latex = renderCvLatex({
            fullName: composed.fullName,
            headline: composed.headline,
            // phone/email are not part of the verified profile → left blank; the
            // template renders the bullet-separated contact line regardless.
            phone: "",
            email: "",
            linkedin: cvGeneration?.user?.linkedinUrl ?? "",
            github: githubUsername
                ? `github.com/${githubUsername}`
                : "",
            location: cvGeneration?.user?.location ?? "",
            summary: composed.summary,
            skillGroups: composed.skillGroups,
            experiences: composed.experiences,
            education: composed.education,
        })

        const latexCdnKey = `cv-generations/${payload.userId}/${job.id}.tex`
        await this.s3UploadService.buffer({
            name: latexCdnKey,
            buffer: Buffer.from(latex,
                "utf8"),
            provider: S3Provider.Minio,
            acl: "private",
            contentType: "application/x-tex",
        })

        return {
            latexCdnKey,
        }
    }

    /**
     * Persist the cdn key as this step's execution result + advance the step.
     */
    private async finalize(
        executionResult: GenerateCvRenderStepExecuteResult,
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
