/**
 * HTTP/Kafka controller — routes delegate to service.
 * (EN: Controller — routes delegate to service.)
 */
}

    /**
     * GET /api/payment — Xử lý thanh toán giả lập.
     * (EN: GET /api/payment — Handles mock payment processing.)
     */
    @Get()
    /**
 * Logic — Đọc/truy vấn dữ liệu qua `getPayment`.
 * Code — Truy vấn in-memory / DB / cache và map response DTO.
 * (EN Logic: Read/query via `getPayment`.)
 * (EN Code: Query in-memory / DB / cache and map response.)
 */
    getPayment() {
        return {
            service: "Payment Service",
            hostname: os.hostname(),
            timestamp: new Date().toISOString(),
            status: "Ready to process payments",
        }
    }
