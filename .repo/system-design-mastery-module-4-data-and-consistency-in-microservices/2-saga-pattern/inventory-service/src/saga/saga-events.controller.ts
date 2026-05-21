/**
 * HTTP/Kafka controller — routes delegate to service.
 * (EN: Controller — routes delegate to service.)
 */
}

    /**
     * Consume saga topic and route event to inventory handler (VI: consume saga topic va chuyen event vao inventory handler).
     *
     * @param event - Event consumed from Kafka (VI: event nhan tu Kafka).
     * @returns Promise<void> - Completes after inventory reservation logic (VI: hoan tat sau khi xu ly logic reserve ton kho).
     */
    @EventPattern(TOPIC)
    async handle(@Payload() event: SagaEvent) {
        if (!event?.event) {
            return
        }
        this.log.log(`Consumed event "${event.event}" for order "${event.orderId}"`)
        await this.stock.handleSagaEvent(event)
    }
}
