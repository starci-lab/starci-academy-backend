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
export class NowPaymentsWebhookModule extends ConfigurableModuleClass {}
