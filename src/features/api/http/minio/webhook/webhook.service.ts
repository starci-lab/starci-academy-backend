import {
    CVSubmissionEntity,
    CvSubmissionStatus,
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import {
    EnqueueProcessCvSubmissionJobService,
} from "@modules/bussiness"
import {
    Injectable,
    Logger,
} from "@nestjs/common"
import {
    EntityManager,
} from "typeorm"
import {
    MinioWebhookRequest,
} from "./dtos"

/**
 * Service for handling MinIO bucket notifications.
 */
@Injectable()
export class MinioWebhookService {
    private readonly logger = new Logger(MinioWebhookService.name)

    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly enqueueJobService: EnqueueProcessCvSubmissionJobService,
    ) {}

    /**
     * Executes the logic to handle MinIO events and trigger automated analysis.
     * @param body - The MinIO event notification payload.
     */
    async execute(
        body: MinioWebhookRequest,
    ): Promise<void> {
        this.logger.log(`Received MinIO webhook with ${body.Records?.length || 0} records.`)

        for (const record of body.Records || []) {
            const key = record.s3?.object?.key
            if (!key) {
                continue
            }

            // Pattern: cv-submissions/<userId>/<submissionId>.<ext>
            if (key.startsWith("cv-submissions/")) {
                await this.handleCvSubmission(key)
            }
        }
    }

    /**
     * Handles an automated CV analysis trigger based on a file upload key.
     * @param key - S3 object key.
     */
    private async handleCvSubmission(
        key: string,
    ): Promise<void> {
        this.logger.log(`Processing CV submission trigger for key: ${key}`)

        // 1. Extract submissionId from key
        // Format: cv-submissions/userId/submissionId.ext
        const parts = key.split("/")
        if (parts.length < 3) {
            this.logger.warn(`Invalid CV submission key format: ${key}`)
            return
        }

        const fileName = parts[2]
        const submissionId = fileName.split(".")[0]

        // 2. Find the submission record and its user
        const submission = await this.entityManager.findOne(
            CVSubmissionEntity,
            {
                where: {
                    id: submissionId,
                },
                relations: [
                    "user",
                ],
            },
        )

        if (!submission) {
            this.logger.warn(`CV submission record not found for ID: ${submissionId}`)
            return
        }

        // 3. Prevent duplicate processing
        if (submission.status !== CvSubmissionStatus.Pending) {
            this.logger.log(`CV submission ${submissionId} is already in state: ${submission.status}. Skipping.`)
            return
        }

        // 4. Update status and enqueue job
        // Note: We use system defaults for model/provider (suitability decided by enqueue service)
        await this.enqueueJobService.enqueue({
            userId: submission.user.id,
            cvSubmissionId: submission.id,
        })

        this.logger.log(`Automated analysis job enqueued for CV submission: ${submissionId}`)
    }
}
