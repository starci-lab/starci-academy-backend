import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./payos.module-definition"
import {
    CreatePaymentLinkModule,
} from "./create-payment-link"
import {
    PaymentRequestModule,
} from "./payment-request"
import {
    PayosWebhookModule,
} from "./webhook"

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
