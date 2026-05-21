/**
 * HTTP/Kafka controller — routes delegate to service.
 * (EN: Controller — routes delegate to service.)
 */
}

    @EventPattern("platform-events")
    /**
     * Logic — consumer group nhận message từ topic; delegate sang ConsumerService.
     * Code — @EventPattern + @Payload → process().
     * (EN Logic: Consumer group receives topic messages; delegates to ConsumerService.)
     * (EN Code: @EventPattern + @Payload → process().)
     */
    async handle(@Payload() data: Record<string, string | number | boolean>): Promise<void> {
        return this.consumer.process(data)
    }
