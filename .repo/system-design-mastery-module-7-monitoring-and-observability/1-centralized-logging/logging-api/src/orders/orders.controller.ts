/**
 * HTTP/Kafka controller — routes delegate to service.
 * (EN: Controller — routes delegate to service.)
 */
}

    /**
     * GET /api/orders — accepted order; logs INFO to Loki for query demo.
     */
    @Get()
    /**
 * Logic: Business handler `accept` for the lab.
 * Code: `accept()` — in-class handler logic.
 */
    accept(): { status: string; trace: string } {
        return this.ordersService.accept()
    }

    /**
     * GET /api/orders/error — deliberate failure; Sentry captures exception, Winston logs ERROR to Loki.
     */
    @Get("error")
    /**
 * Logic: Business handler `error` for the lab.
 * Code: `error()` — in-class handler logic.
 */
    error(): never {
        return this.ordersService.fail()
    }
