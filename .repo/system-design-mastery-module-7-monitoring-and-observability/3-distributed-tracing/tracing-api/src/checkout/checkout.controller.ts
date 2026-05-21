/**
 * HTTP/Kafka controller — routes delegate to service.
 * (EN: Controller — routes delegate to service.)
 */
}

    /**
     * Logic — mô phỏng checkout một bước để học viên có Trace + Span con trong Jaeger UI / Query API.
     * Code — `@Get('checkout')` delegate sang service (`simulateCheckout`).
     * (EN Logic: Simulate single-step checkout so learners see Trace + child spans in Jaeger.)
     * (EN Code: `@Get('checkout')` delegates to service (`simulateCheckout`).)
     */
    @Get("checkout")/**
 * Logic — Xử lý nghiệp vụ `simulateCheckout` cho lab.
 * Code — `simulateCheckout()` — logic trong service/controller.
 * (EN Logic: Business handler `simulateCheckout` for the lab.)
 * (EN Code: `simulateCheckout()` — in-class handler logic.)
 */
    simulateCheckout(): Promise<{ message: string; traceId: string }> {
        return this.checkout.simulateCheckout()
    }
}
