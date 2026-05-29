import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./webhook.module-definition"
import {
    StripeWebhookController,
} from "./webhook.controller"
import {
    StripeWebhookService,
} from "./webhook.service"
import {
    StripeWebhookHandler,
} from "./webhook.handler"

@Module({
    controllers: [
        StripeWebhookController,
    ],
    providers: [
        StripeWebhookService,
        StripeWebhookHandler,
    ],
})
export class StripeWebhookModule extends ConfigurableModuleClass {}
