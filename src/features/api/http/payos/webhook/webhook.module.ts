import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./webhook.module-definition"
import {
    PayosWebhookController,
} from "./webhook.controller"
import {
    PayosWebhookService,
} from "./webhook.service"

/**
 * Module for the payOS webhook.
 */
@Module(
    {
        controllers: [
            PayosWebhookController,
        ],
        providers: [
            PayosWebhookService,
        ],
    },
)
export class PayosWebhookModule extends ConfigurableModuleClass {}
