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
import {
    CvGenerationStepResultMissingException,
} from "@modules/exceptions"
import type {
    ExtendedGenerateCvContext,
    GenerateCvComposeStepExecuteResult,
    GenerateCvRenderStepExecuteResult,
} from "../types"
import {
    renderCvLatex,
} from "./latex"
import {
    compileCvPdf,
} from "./compile-cv-pdf"

/**
 * Step 2 — render. Reads the structured CV JSON from the compose step, fills the
 * LaTeX template (every user-supplied value is LaTeX-escaped inside the
 * template's `tex` helper), and uploads the `.tex` document to MinIO under
 * `cv-generations/{userId}/{jobId}.tex`. Then compiles that `.tex` into a real
 * PDF (`tectonic`, best-effort — {@link compileCvPdf}) and, when it succeeds,
 * uploads the PDF alongside it. Both object keys are persisted as this step's
 * execution result for the complete step to copy onto the entity — the PDF key
 * is `null` when the compile failed, and the job still succeeds (degrades to
 * the raw `.tex` download, same contract the FE preview already has).
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
            throw new CvGenerationStepResultMissingException({
                step: "compose",
                stage: "render",
            })
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

        // best-effort compile — a failure here (missing `tectonic` binary in
        // local dev, a compile error in the AI-generated .tex) must not fail the
        // whole render step; the job still succeeds with `pdfCdnKey: null`.
        let pdfCdnKey: string | null = null
        const pdf = await compileCvPdf({
            latex,
            jobId: job.id ?? payload.userId,
        })
        if (pdf) {
            pdfCdnKey = `cv-generations/${payload.userId}/${job.id}.pdf`
            await this.s3UploadService.buffer({
                name: pdfCdnKey,
                buffer: pdf,
                provider: S3Provider.Minio,
                acl: "private",
                contentType: "application/pdf",
            })
        } else {
            this.winstonService.log(
                WinstonLog.ProcessCVSubmissionStepExecuted,
                {
                    jobId: job.id ?? "",
                    queueName: context.queueName,
                    step: this.stepName,
                    stepIndex: this.stepIndex,
                    payload,
                    success: false,
                    error: "PDF compile failed or tectonic unavailable — degraded to .tex only",
                },
            )
        }

        return {
            latexCdnKey,
            pdfCdnKey,
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
