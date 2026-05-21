/**
 * HTTP/Kafka controller — routes delegate to service.
 * (EN: Controller — routes delegate to service.)
 */
}

  @Post("check")
    async check(
    @Body() body: { orderId: number; productId: number; quantity: number },
    : ReturnType<StockService["tryFulfill"]> {
        return this.stock.tryFulfill(body.orderId,
            body.productId,
            body.quantity
        )
    }
}
