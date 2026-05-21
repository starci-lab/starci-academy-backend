/**
 * HTTP/Kafka controller — routes delegate to service.
 * (EN: Controller — routes delegate to service.)
 */
}

    @EventPattern("platform-events")
    /**
     * Logic — consumer group nhận message; delegate ConsumerService.
     * (EN Logic: Consumer group receives messages; delegates to ConsumerService.)
     */
/**
 * Logic — xử lý demo cho `handle`.
 * (EN: Logic — demo handler for `handle`.)
 */
    async handle(@Payload() data: Record<string, string | number | boolean>): Promise<void> {
        return this.consumer.process(data)
    }
