/**
 * Controller — routes delegate to service.
 */
}

    /**
     * Logic — Receives `order-events` from Kafka, calls service to update stock.
     * Code — `@EventPattern` listens on topic, `@Payload()` extracts message payload.
     */
    @EventPattern("order-events")
    handleOrderCreated(@Payload() data) {
        this.logger.log(`Received ORDER_CREATED event: ${JSON.stringify(data)}`)
        this.appService.updateStock(data)
    }
