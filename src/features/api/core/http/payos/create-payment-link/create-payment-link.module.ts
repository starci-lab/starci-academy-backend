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
import {
    CreatePaymentLinkHandler,
} from "./create-payment-link.handler"

@Module({
    controllers: [
        CreatePaymentLinkController,
    ],
    providers: [
        CreatePaymentLinkService,
        CreatePaymentLinkHandler,
    ],
})
/**
 * Wires create-payment-link so checkout minting is a standalone HTTP operation, not a
 * GraphQL mutation.
 */
export class CreatePaymentLinkModule extends ConfigurableModuleClass {}
