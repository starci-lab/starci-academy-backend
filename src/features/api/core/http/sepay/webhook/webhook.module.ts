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
export class SepayWebhookModule extends ConfigurableModuleClass {}
