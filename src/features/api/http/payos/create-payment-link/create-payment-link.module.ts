import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./create-payment-link.module-definition"
import {
    CreatePaymentLinkController,
} from "./create-payment-link.controller"
import {
    CreatePaymentLinkService,
} from "./create-payment-link.service"

/**
 * Module for the payOS create payment link endpoint.
 */
@Module(
    {
        controllers: [
            CreatePaymentLinkController,
        ],
        providers: [
            CreatePaymentLinkService,
        ],
    },
)
export class CreatePaymentLinkModule extends ConfigurableModuleClass {}
