/**
 * HTTP/Kafka controller — routes delegate to service.
 * (EN: Controller — routes delegate to service.)
 */
}

  /**
   * Consume saga topic and route event to payment handler (VI: consume saga topic va chuyen event vao payment handler).
   *
   * @param event - Event consumed from Kafka (VI: event nhan tu Kafka).
   * @returns Promise<void> - Completes after payment side-effects and emits (VI: hoan tat sau khi xu ly payment va phat event tiep theo).
   */
  @EventPattern(TOPIC)
    async handle(@Payload() event: SagaEvent) {
        if (!event?.event) {
            return
        }
        this.log.log(`Consumed event "${event.event}" for order "${event.orderId}"`)
        await this.payment.handleSagaEvent(event)
    }
}
