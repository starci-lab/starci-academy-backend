import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./payment-request.module-definition"
import {
    PaymentRequestController,
} from "./payment-request.controller"
import {
    PaymentRequestService,
} from "./payment-request.service"

/**
 * Module for the payOS GET payment request endpoint.
 */
@Module(
    {
        controllers: [
            PaymentRequestController,
        ],
        providers: [
            PaymentRequestService,
        ],
    },
)
export class PaymentRequestModule extends ConfigurableModuleClass {}
