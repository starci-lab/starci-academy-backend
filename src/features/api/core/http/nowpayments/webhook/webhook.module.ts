import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./webhook.module-definition"
import {
    NowPaymentsWebhookController,
} from "./webhook.controller"
import {
    NowPaymentsWebhookService,
} from "./webhook.service"
import {
    NowPaymentsWebhookHandler,
} from "./webhook.handler"

@Module({
    controllers: [
        NowPaymentsWebhookController,
    ],
    providers: [
        NowPaymentsWebhookService,
        NowPaymentsWebhookHandler,
    ],
})
/**
 * Wires the NOWPayments IPN controller + handler so crypto settlement stays off the
 * GraphQL mutation tree.
 */
export class NowPaymentsWebhookModule extends ConfigurableModuleClass {}
