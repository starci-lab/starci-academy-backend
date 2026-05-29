import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./stripe.module-definition"
import {
    StripeWebhookModule,
} from "./webhook"

/**
 * Module for Stripe HTTP (webhook).
 */
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
export class StripeModule extends ConfigurableModuleClass {}
