import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./paypal.module-definition"
import {
    PaypalWebhookModule,
} from "./webhook"

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
/**
 * Module for PayPal HTTP (webhook).
 */
export class PaypalModule extends ConfigurableModuleClass {}
