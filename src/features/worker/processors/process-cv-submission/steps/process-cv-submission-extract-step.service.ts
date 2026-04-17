import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import {
    JobActionService,
} from "@modules/bussiness"
import {
    Injectable,
} from "@nestjs/common"
import type {
    EntityManager,
} from "typeorm"
import {
    AbstractStepService,
} from "../../abstracts"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import type {
    ExtendedProcessCvSubmissionContext,
    ProcessCvSubmissionExtractStepExecuteResult,
} from "../types"
import {
    JobExtendedContext,
} from "../../types"
import {
    ProcessCVSubmissionPayload,
} from "@modules/bullmq"
import {
    S3Provider,
    S3ReadService,
} from "@modules/s3"
import pdf from "pdf-parse"
import mammoth from "mammoth"

/**
 * Step 0: Download file from MinIO -> Extract text from PDF/DOCX.
 */
@Injectable()
export class ProcessCvSubmissionExtractStepService extends AbstractStepService<
    ProcessCVSubmissionPayload,
    ExtendedProcessCvSubmissionContext
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

    stepName = "extract"

    async process(
        context: JobExtendedContext<
            ProcessCVSubmissionPayload,
            ExtendedProcessCvSubmissionContext
        >,
    ): Promise<void> {
        const executionResult = await this.execute(context)
        await this.finalize(
            executionResult,
            context,
        )
    }

    private async execute(
        context: JobExtendedContext<
            ProcessCVSubmissionPayload,
            ExtendedProcessCvSubmissionContext
        >,
    ): Promise<ProcessCvSubmissionExtractStepExecuteResult> {
        const {
            cvSubmission,
        } = context.extended!
        const key = cvSubmission.fileUrl

        // 1. Download from MinIO using S3ReadService
        const buffer = await this.s3ReadService.buffer({
            key,
            provider: S3Provider.Minio,
        })

        if (!buffer || buffer.length === 0) {
            throw new Error(`Failed to download CV file or file is empty: ${key}`)
        }

        // 2. Extract text based on extension
        let text = ""
        const ext = key.split(".").pop()?.toLowerCase()

        if (ext === "pdf") {
            const data = await pdf(buffer)
            text = data.text
        } else if (ext === "docx") {
            const result = await mammoth.extractRawText({
                buffer,
            })
            text = result.value
        } else {
            throw new Error(`Unsupported file extension for CV extraction: ${ext}`)
        }

        if (!text.trim()) {
            throw new Error("Extracted CV text is empty.")
        }

        return {
            originalText: text,
        }
    }

    private async finalize(
        executionResult: ProcessCvSubmissionExtractStepExecuteResult,
        context: JobExtendedContext<
            ProcessCVSubmissionPayload,
            ExtendedProcessCvSubmissionContext
        >,
    ): Promise<void> {
        const {
            job,
            payload,
            queueName,
        } = context

        await this.entityManager.transaction(async (entityManager) => {
            // Update the entity with extracted text
            await entityManager.update(
                context.extended!.cvSubmission.constructor,
                context.extended!.cvSubmission.id,
                {
                    originalText: executionResult.originalText,
                },
            )

            // Advance the job
            await this.jobActionService.increaseJob({
                job,
                entityManager,
            })

            // Save execution result
            await this.jobActionService.saveExecutionResult({
                job,
                key: this.stepName,
                executionResult,
                entityManager,
            })
        })

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
