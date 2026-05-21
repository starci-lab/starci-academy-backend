/**
 * Module Checkout — đăng ký controller + service cho demo tracing một endpoint.
 * (EN: Checkout module — registers controller + service for single-endpoint tracing demo.)
 */
import {
    Module,
} from "@nestjs/common"
import {
    CheckoutController,
} from "."
import {
    CheckoutService,
} from "."

@Module({
    controllers: [CheckoutController],
    providers: [CheckoutService],
})
/**
 * Class `CheckoutModule` — thành phần lab (controller/service/module).
 * (EN: Class `CheckoutModule` — lesson lab component.)
 */
export class CheckoutModule {}
