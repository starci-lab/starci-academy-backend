/**
 * HTTP/Kafka controller — routes delegate to service.
 * (EN: Controller — routes delegate to service.)
 */
}

    /**
     * Logic — endpoint public cho client thực hiện thanh toán qua bank-service.
     * Code — `@Get("pay")` → gọi `clientService.pay()` (xử lý Timeout + Retry nội bộ).
     * (EN Logic: Public endpoint for client to execute payment through bank-service.)
     * (EN Code: `@Get("pay")` → calls `clientService.pay()` (handles Timeout + Retry internally).)
     */
    @Get("pay")
    /**
 * Logic — Xử lý nghiệp vụ `pay` cho lab.
 * Code — `pay()` — logic trong service/controller.
 * (EN Logic: Business handler `pay` for the lab.)
 * (EN Code: `pay()` — in-class handler logic.)
 */
    pay(): ReturnType<ClientService["pay"]> {
        return this.clientService.pay()
    }
