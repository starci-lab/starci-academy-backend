/**
 * Controller — routes delegate to service.
 */
}

    /**
     * Health check endpoint.
     */
    @Get("health")
    /**
 * Logic — Read/query via `getHealth`.
 * Code — Query in-memory / DB / cache and map response.
 */
    async getHealth(): Promise<HealthResponse> {
        return this.appService.getHealth()
    }

    /**
     * Create a new item.
     */
    @Post("items")
    async createItem(@Body() body: { name: string }): Promise<CreateItemResponse> {
        return this.appService.createItem(body.name)
    }

    /**
     * Get item list (cache-aside).
     */
    @Get("items")
    /**
 * Logic — Read/query via `getItems`.
 * Code — Query in-memory / DB / cache and map response.
 */
    async getItems(): Promise<GetItemsResponse | { error: string }> {
        return this.appService.getItems()
    }
