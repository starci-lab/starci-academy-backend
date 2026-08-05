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
import {
    SepayWebhookHandler,
} from "./webhook.handler"

@Module({
    controllers: [
        SepayWebhookController,
    ],
    providers: [
        SepayWebhookService,
        SepayWebhookHandler,
    ],
})
/**
 * Wires the SePay IPN controller + handler so VN bank-transfer settlement stays off
 * GraphQL.
 */
export class SepayWebhookModule extends ConfigurableModuleClass {}
