import {
    Module,
} from "@nestjs/common"
import {
    MinioWebhookController,
} from "./webhook.controller"
import {
    MinioWebhookService,
} from "./webhook.service"
import {
    JobsModule,
} from "@modules/bussiness"

/**
 * Module for handling MinIO-driven automated events.
 */
@Module({
    imports: [
        JobsModule,
    ],
    controllers: [
        MinioWebhookController,
    ],
    providers: [
        MinioWebhookService,
    ],
    exports: [
        MinioWebhookService,
    ],
})
export class MinioWebhookModule {}
