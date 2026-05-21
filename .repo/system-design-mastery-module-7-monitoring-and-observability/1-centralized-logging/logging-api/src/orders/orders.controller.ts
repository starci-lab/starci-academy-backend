/**
 * HTTP/Kafka controller — routes delegate to service.
 * (EN: Controller — routes delegate to service.)
 */
}

    /**
     * GET /api/orders — đơn chấp nhận; ghi INFO log vào Loki để demo query.
     * (EN: GET /api/orders — accepted order; logs INFO to Loki for query demo.)
     */
    @Get()
    /**
 * Logic — Xử lý nghiệp vụ `accept` cho lab.
 * Code — `accept()` — logic trong service/controller.
 * (EN Logic: Business handler `accept` for the lab.)
 * (EN Code: `accept()` — in-class handler logic.)
 */
    accept(): { status: string; trace: string } {
        return this.ordersService.accept()
    }

    /**
     * GET /api/orders/error — cố ý lỗi; Sentry bắt exception, Winston ghi ERROR vào Loki.
     * (EN: GET /api/orders/error — deliberate failure; Sentry captures exception, Winston logs ERROR to Loki.)
     */
    @Get("error")
    /**
 * Logic — Xử lý nghiệp vụ `error` cho lab.
 * Code — `error()` — logic trong service/controller.
 * (EN Logic: Business handler `error` for the lab.)
 * (EN Code: `error()` — in-class handler logic.)
 */
    error(): never {
        return this.ordersService.fail()
    }
