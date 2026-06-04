/**
 * Controller — routes delegate to service.
 */
}

    /**
     * Returns product list from memory for Kong Gateway routing test.
     */
    @Get()
    /**
 * Logic — Read/query via `getProducts`.
 * Code — Query in-memory / DB / cache and map response.
 */
    getProducts() {
        this.logger.log("Received request to fetch products")
        return this.appService.getProducts()
    }
