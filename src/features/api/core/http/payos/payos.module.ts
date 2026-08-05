import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./payos.module-definition"
import {
    CreatePaymentLinkModule,
} from "./create-payment-link/create-payment-link.module"
import {
    PaymentRequestModule,
} from "./payment-request/payment-request.module"
import {
    PayosWebhookModule,
} from "./webhook/webhook.module"

@Module(
    {
        imports: [
            CreatePaymentLinkModule.register(
                {
                    isGlobal: true,
                },
            ),
            PaymentRequestModule.register(
                {
                    isGlobal: true,
                },
            ),
            PayosWebhookModule.register(
                {
                    isGlobal: true,
                },
            ),
        ],
    },
)
/**
 * Module for payOS HTTP (merchant API + webhook).
 */
export class PayosModule extends ConfigurableModuleClass {}
