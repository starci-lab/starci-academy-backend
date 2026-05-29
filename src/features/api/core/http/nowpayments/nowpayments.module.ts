import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./nowpayments.module-definition"
import {
    NowPaymentsWebhookModule,
} from "./webhook"

/**
 * Module for NOWPayments HTTP (IPN webhook).
 */
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
export class NowPaymentsModule extends ConfigurableModuleClass {}
