import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./stripe.module-definition"
import {
    StripeWebhookModule,
} from "./webhook/webhook.module"

@Module(
    {
        imports: [
            StripeWebhookModule.register(
                {
                    isGlobal: true,
                },
            ),
        ],
    },
)
/**
 * Module for Stripe HTTP (webhook).
 */
export class StripeModule extends ConfigurableModuleClass {}
