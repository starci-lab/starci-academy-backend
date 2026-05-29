import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./paypal.module-definition"
import {
    PaypalWebhookModule,
} from "./webhook"

/**
 * Module for PayPal HTTP (webhook).
 */
@Module(
    {
        imports: [
            PaypalWebhookModule.register(
                {
                    isGlobal: true,
                },
            ),
        ],
    },
)
export class PaypalModule extends ConfigurableModuleClass {}
