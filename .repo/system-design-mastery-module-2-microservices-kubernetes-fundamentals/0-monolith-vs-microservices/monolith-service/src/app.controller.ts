/**
 * HTTP/Kafka controller — routes delegate to service.
 * (EN: Controller — routes delegate to service.)
 */
}

    /**
     * GET /api/search — Trả về kết quả tìm kiếm giả lập.
     * (EN: GET /api/search — Returns mock search results.)
     */
    @Get("api/search")
    /**
 * Logic — Đọc/truy vấn dữ liệu qua `getSearch`.
 * Code — Truy vấn in-memory / DB / cache và map response DTO.
 * (EN Logic: Read/query via `getSearch`.)
 * (EN Code: Query in-memory / DB / cache and map response.)
 */
    getSearch() {
        return {
            service: "Monolith Service",
            module: "Search",
            hostname: os.hostname(),
            timestamp: new Date().toISOString(),
            results: ["Product 1", "Product 2", "Product 3"],
        }
    }

    /**
     * GET /api/payment — Xử lý logic thanh toán giả lập.
     * (EN: GET /api/payment — Handles mock payment logic.)
     */
    @Get("api/payment")
    /**
 * Logic — Đọc/truy vấn dữ liệu qua `getPayment`.
 * Code — Truy vấn in-memory / DB / cache và map response DTO.
 * (EN Logic: Read/query via `getPayment`.)
 * (EN Code: Query in-memory / DB / cache and map response.)
 */
    getPayment() {
        return {
            service: "Monolith Service",
            module: "Payment",
            hostname: os.hostname(),
            timestamp: new Date().toISOString(),
            status: "Ready to process payments",
        }
    }
