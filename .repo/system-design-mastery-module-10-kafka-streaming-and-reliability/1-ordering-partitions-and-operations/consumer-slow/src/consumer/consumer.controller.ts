/**
 * HTTP/Kafka controller — routes delegate to service.
 * (EN: Controller — routes delegate to service.)
 */
}

    @EventPattern("ordering-events")
    /**
     * Logic — cùng consumer group; so sánh lag fast vs slow trên UI.
     * (EN Logic: Same consumer group; compare fast vs slow lag in UI.)
     */
/**
 * Logic — xử lý demo cho `handle`.
 * (EN: Logic — demo handler for `handle`.)
 */
    async handle(@Payload() data: Record<string, string | number | boolean>): Promise<void> {
        return this.consumer.process(data)
    }
