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
export class PaymentRequestModule extends ConfigurableModuleClass {}
