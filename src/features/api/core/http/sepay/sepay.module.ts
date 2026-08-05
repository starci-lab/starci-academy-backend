import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./sepay.module-definition"
import {
    SepayWebhookModule,
} from "./webhook/webhook.module"

@Module(
    {
        imports: [
            SepayWebhookModule.register(
                {
                    isGlobal: true,
                },
            ),
        ],
    },
)
/**
 * Module for SePay HTTP (webhook).
 */
export class SepayModule extends ConfigurableModuleClass {}
