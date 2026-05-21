/**
 * HTTP/Kafka controller — routes delegate to service.
 * (EN: Controller — routes delegate to service.)
 */
}

    /**
     * GET /api/search — Trả về kết quả tìm kiếm giả lập.
     * (EN: GET /api/search — Returns mock search results.)
     */
    @Get()
    /**
 * Logic — Đọc/truy vấn dữ liệu qua `getSearch`.
 * Code — Truy vấn in-memory / DB / cache và map response DTO.
 * (EN Logic: Read/query via `getSearch`.)
 * (EN Code: Query in-memory / DB / cache and map response.)
 */
    getSearch() {
        return {
            service: "Search Service",
            hostname: os.hostname(),
            timestamp: new Date().toISOString(),
            results: ["Product 1", "Product 2", "Product 3"],
        }
    }
