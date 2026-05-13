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
    JobExtendedContext,
} from "@modules/bussiness"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import type {
    ExtendedReviewCvSubmissionContext,
    ReviewCvSubmissionExtractStepExecuteResult,
} from "../types"
import {
    S3Provider,
    S3ReadService,
} from "@modules/s3"
import pdf from "pdf-parse"
import mammoth from "mammoth"
import {
    ReviewCvSubmissionPayload,
} from "@modules/bullmq"
import {
    CvSubmissionExtractEmptyTextException, 
    CvSubmissionExtractS3BufferEmptyException, 
    CvSubmissionExtractUnsupportedExtensionException 
} from "@modules/exceptions"

/**
 * Step 0: Download file from MinIO -> Extract text from PDF/DOCX.
 */
@Injectable()
export class ReviewCvSubmissionExtractStepService extends AbstractStepService<
    ReviewCvSubmissionPayload,
    ExtendedReviewCvSubmissionContext
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

    /**
     * Process the step.
     * @param context - Job context.
     */
    async process(
        context: JobExtendedContext<
            ReviewCvSubmissionPayload,
            ExtendedReviewCvSubmissionContext
        >,
    ): Promise<void> {
        const executionResult = await this.execute(context)
        await this.finalize(
            executionResult,
            context,
        )
    }

    /**
     * Execute the step.
     * @param context - Job context.
     * @returns The execution result.
     */
    private async execute(
        context: JobExtendedContext<
            ReviewCvSubmissionPayload,
            ExtendedReviewCvSubmissionContext
        >,
    ): Promise<ReviewCvSubmissionExtractStepExecuteResult> {
        // 1. Download from MinIO using S3ReadService
        const buffer = await this.s3ReadService.buffer({
            key: context.extended.cvSubmission.cdnKey,
            provider: S3Provider.Minio,
        })

        if (!buffer || buffer.length === 0) {
            throw new CvSubmissionExtractS3BufferEmptyException({
                key: context.extended.cvSubmission.cdnKey,
                provider: S3Provider.Minio,
            })
        }

        // 2. Extract text based on extension
        let text = ""
        const ext = context.extended.cvSubmission.cdnKey.split(".").pop()?.toLowerCase()
        switch (ext) {
        case "pdf": {
            const data = await pdf(buffer)
            text = data.text
            break
        }
        case "docx": {
            const result = await mammoth.extractRawText({
                buffer,
            })
            text = result.value
            break
        }
        default: {
            throw new CvSubmissionExtractUnsupportedExtensionException(
                {
                    extension: ext,
                }
            )
        }
        }
        if (!text.trim()) {
            throw new CvSubmissionExtractEmptyTextException({
                key: context.extended.cvSubmission.cdnKey,
            })
        }

        return {
            originalText: text,
        }
    }

    /**
     * Finalize the step.
     * @param executionResult - The execution result.
     * @param context - Job context.
     */
    private async finalize(
        executionResult: ReviewCvSubmissionExtractStepExecuteResult,
        context: JobExtendedContext<
            ReviewCvSubmissionPayload,
            ExtendedReviewCvSubmissionContext
        >,
    ): Promise<void> {
        const {
            job,
            payload,
            queueName,
        } = context

        await this.entityManager.transaction(
            async (entityManager) => {
                await this.jobActionService.increaseJob({
                    job,
                    entityManager,
                })

                await this.jobActionService.saveExecutionResult({
                    job,
                    key: this.stepName,
                    executionResult,
                    entityManager,
                })
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
