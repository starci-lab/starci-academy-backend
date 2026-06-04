/**
 * Controller — routes delegate to service.
 */
}

    /**
     * Returns order list from memory for Kong Gateway routing test.
     */
    @Get()
    /**
 * Logic — Read/query via `getOrders`.
 * Code — Query in-memory / DB / cache and map response.
 */
    getOrders() {
        this.logger.log("Received request to fetch orders")
        return this.appService.getOrders()
    }
