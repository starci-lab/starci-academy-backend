import {
    MinioWebhookRequest,
} from "./dtos/webhook.request"

/**
 * CQRS envelope for a MinIO/S3 notification so the controller does not parse Records
 * inline.
 */
export class MinioWebhookCommand {
    constructor(
        readonly params: MinioWebhookRequest,
    ) {}
}
