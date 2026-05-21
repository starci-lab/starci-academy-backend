/**
 * HTTP/Kafka controller — routes delegate to service.
 * (EN: Controller — routes delegate to service.)
 */
}

    /**
     * Health check.
     * (EN: Health check endpoint.)
     */
    @Get("health")
    /**
 * Logic — Đọc/truy vấn dữ liệu qua `getHealth`.
 * Code — Truy vấn in-memory / DB / cache và map response DTO.
 * (EN Logic: Read/query via `getHealth`.)
 * (EN Code: Query in-memory / DB / cache and map response.)
 */
    async getHealth(): Promise<HealthResponse> {
        return this.appService.getHealth()
    }

    /**
     * Tạo item mới.
     * (EN: Create a new item.)
     */
    @Post("items")
    async createItem(@Body() body: { name: string }): Promise<CreateItemResponse> {
        return this.appService.createItem(body.name)
    }

    /**
     * Lấy danh sách item (cache-aside).
     * (EN: Get item list (cache-aside).)
     */
    @Get("items")
    /**
 * Logic — Đọc/truy vấn dữ liệu qua `getItems`.
 * Code — Truy vấn in-memory / DB / cache và map response DTO.
 * (EN Logic: Read/query via `getItems`.)
 * (EN Code: Query in-memory / DB / cache and map response.)
 */
    async getItems(): Promise<GetItemsResponse | { error: string }> {
        return this.appService.getItems()
    }
