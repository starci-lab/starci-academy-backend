/**
 * HTTP/Kafka controller — routes delegate to service.
 * (EN: Controller — routes delegate to service.)
 */
}

    /**
     * Logic — khi Order Service emit event, trừ kho sản phẩm nếu có thông tin hợp lệ.
     * Code — `@EventPattern("order-events")` → kiểm tra `productName` + `quantity` → gọi `decrementStockByProductName`.
     * (EN Logic: When Order Service emits an event, decrement product stock if valid info provided.)
     * (EN Code: `@EventPattern("order-events")` → check `productName` + `quantity` → call `decrementStockByProductName`.)
     */
    @EventPattern("order-events")
    async onOrder(@Payload() data: OrderEventPayload): Promise<void> {
        this.logger.log(`Received "order-events" payload: ${JSON.stringify(data)}`)
        const productName =
            typeof data.productName === "string" ? data.productName : null
        const quantity = typeof data.quantity === "number" ? data.quantity : null
        if (productName && quantity != null && quantity > 0) {
            await this.inventory.decrementStockByProductName(productName, quantity)
        }
    }
