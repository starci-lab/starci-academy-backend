import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./nowpayments.module-definition"
import {
    NowPaymentsWebhookModule,
} from "./webhook/webhook.module"

@Module(
    {
        imports: [
            NowPaymentsWebhookModule.register(
                {
                    isGlobal: true,
                },
            ),
        ],
    },
)
/**
 * Module for NOWPayments HTTP (IPN webhook).
 */
export class NowPaymentsModule extends ConfigurableModuleClass {}
