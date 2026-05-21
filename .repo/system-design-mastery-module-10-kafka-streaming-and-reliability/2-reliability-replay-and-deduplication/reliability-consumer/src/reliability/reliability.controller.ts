/**
 * HTTP/Kafka controller — routes delegate to service.
 * (EN: Controller — routes delegate to service.)
 */
}

    @EventPattern("reliability-events")
/**
 * Logic — xử lý demo cho `handle`.
 * (EN: Logic — demo handler for `handle`.)
 */
    async handle(@Payload() data: ProcessEventPayload): Promise<void> {
        try {
            await this.reliability.processEvent(data)
        } catch (error) {
            const message = error instanceof Error ? error.message : "Unknown error"
            this.logger.error(`Failed: ${message} — will retry / DLQ via Kafka`)
            throw error
        }
    }
