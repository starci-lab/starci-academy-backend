/**
 * HTTP controller — routes delegate to service.
 * (EN: Controller — routes delegate to service.)
 */
import {
    Controller,
    Get,
} from "@nestjs/common"
import {
    CheckoutService,
} from "./checkout.service"

@Controller()
/**
 * Class `CheckoutController` — lesson lab component.
 * (EN: Class `CheckoutController` — lesson lab component.)
 */
export class CheckoutController {
    constructor(private readonly checkout: CheckoutService) {}

    /**
     * Logic: Simulate single-step checkout so learners see Trace + child spans in Jaeger.
     * Code: `@Get('checkout')` delegates to service (`simulateCheckout`).
     */
    @Get("checkout")
    simulateCheckout(): Promise<{ message: string; traceId: string }> {
        return this.checkout.simulateCheckout()
    }
}
