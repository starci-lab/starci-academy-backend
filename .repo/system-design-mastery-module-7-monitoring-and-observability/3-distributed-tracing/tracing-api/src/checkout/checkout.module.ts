/**
 * Checkout module — registers controller + service for single-endpoint tracing demo.
 */
import {
    Module,
} from "@nestjs/common"
import {
    CheckoutController,
} from "./checkout.controller"
import {
    CheckoutService,
} from "./checkout.service"

@Module({
    controllers: [CheckoutController],
    providers: [CheckoutService],
})
/**
 * Class `CheckoutModule` — lesson lab component.
 */
export class CheckoutModule {}
