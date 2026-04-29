import {
    JobsModule,
} from "@modules/bussiness"
import {
    Module,
} from "@nestjs/common"
import {
    MinioWebhookController,
} from "./webhook.controller"
import {
    MinioWebhookHandler,
} from "./webhook.handler"
import {
    MinioWebhookService,
} from "./webhook.service"
import {
    ConfigurableModuleClass,
} from "./webhook.module-definition"

/**
 * Module for the Minio webhook.
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
        MinioWebhookHandler,
    ],
    exports: [
        MinioWebhookService,
    ],
})
export class MinioWebhookModule extends ConfigurableModuleClass {}
