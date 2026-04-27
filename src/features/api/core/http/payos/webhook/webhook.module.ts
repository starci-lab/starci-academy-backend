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
import {
    PayosWebhookHandler,
} from "./webhook.handler"

@Module({
    controllers: [
        PayosWebhookController,
    ],
    providers: [
        PayosWebhookService,
        PayosWebhookHandler,
    ],
})
export class PayosWebhookModule extends ConfigurableModuleClass {}
