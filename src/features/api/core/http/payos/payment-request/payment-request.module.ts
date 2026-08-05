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
import {
    PaymentRequestHandler,
} from "./payment-request.handler"

@Module({
    controllers: [
        PaymentRequestController,
    ],
    providers: [
        PaymentRequestService,
        PaymentRequestHandler,
    ],
})
/**
 * Wires the PayOS payment-status query as its own HTTP operation so checkout polling does
 * not share the create-link module.
 */
export class PaymentRequestModule extends ConfigurableModuleClass {}
