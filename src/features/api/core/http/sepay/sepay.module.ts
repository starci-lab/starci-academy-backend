import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./sepay.module-definition"
import {
    SepayWebhookModule,
} from "./webhook"

/**
 * Module for SePay HTTP (webhook).
 */
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
export class SepayModule extends ConfigurableModuleClass {}
