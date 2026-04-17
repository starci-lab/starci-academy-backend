import {
    Injectable,
    Logger,
} from "@nestjs/common"
import {
    MinioWebhookRequest,
} from "./dtos"

/**
 * Service for handling MinIO bucket notifications.
 */
@Injectable()
export class MinioWebhookService {
    private readonly logger = new Logger(MinioWebhookService.name)

    constructor() {}

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

            // CV submissions are now triggered manually from the frontend.
            if (key.startsWith("cv-submissions/")) {
                this.logger.log(`Ignoring CV upload webhook for manual-trigger flow: ${key}`)
                continue
            }
        }
    }
}
