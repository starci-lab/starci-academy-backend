/**
 * Controller — routes delegate to service.
 */
}

    /**
     * Logic — Receives POST /orders from client, calls service to create order + emit event.
     * Code — `@Post()` maps REST endpoint, delegates to `AppService.createOrder`.
     */
    @Post()
    async createOrder(@Body() orderData) {
        this.logger.log("Received request to create order")
        return this.appService.createOrder(orderData)
    }
