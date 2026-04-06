import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./webhook.module-definition"
import {
    SepayWebhookController,
} from "./webhook.controller"
import {
    SepayWebhookService,
} from "./webhook.service"

/**
 * Module for the SePay webhook.
 */
@Module(
    {
        controllers: [
            SepayWebhookController,
        ],
        providers: [
            SepayWebhookService,
        ],
    },
)
export class SepayWebhookModule extends ConfigurableModuleClass {}
