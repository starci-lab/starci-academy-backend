/**
 * Controller — routes delegate to service.
 */
}

    /**
     * GET /api/search — Returns mock search results.
     */
    @Get()
    /**
 * Logic — Read/query via `getSearch`.
 * Code — Query in-memory / DB / cache and map response.
 */
    getSearch() {
        return {
            service: "Search Service",
            hostname: os.hostname(),
            timestamp: new Date().toISOString(),
            results: ["Product 1", "Product 2", "Product 3"],
        }
    }
