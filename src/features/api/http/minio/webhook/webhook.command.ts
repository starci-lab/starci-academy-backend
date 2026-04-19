import {
    MinioWebhookRequest,
} from "./dtos"

export class MinioWebhookCommand {
    constructor(
        readonly params: MinioWebhookRequest,
    ) {}
}
