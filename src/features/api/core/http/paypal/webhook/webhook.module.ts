import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./webhook.module-definition"
import {
    PaypalWebhookController,
} from "./webhook.controller"
import {
    PaypalWebhookService,
} from "./webhook.service"
import {
    PaypalWebhookHandler,
} from "./webhook.handler"

@Module({
    controllers: [
        PaypalWebhookController,
    ],
    providers: [
        PaypalWebhookService,
        PaypalWebhookHandler,
    ],
})
/**
 * Wires the PayPal webhook controller + handler so capture settlement stays off GraphQL.
 */
export class PaypalWebhookModule extends ConfigurableModuleClass {}
