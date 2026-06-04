/**
 * Controller — routes delegate to service.
 */
}

    /**
     * GET /api/search — Returns mock search results.
     */
    @Get("api/search")
    /**
 * Logic — Read/query via `getSearch`.
 * Code — Query in-memory / DB / cache and map response.
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
     * GET /api/payment — Handles mock payment logic.
     */
    @Get("api/payment")
    /**
 * Logic — Read/query via `getPayment`.
 * Code — Query in-memory / DB / cache and map response.
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
