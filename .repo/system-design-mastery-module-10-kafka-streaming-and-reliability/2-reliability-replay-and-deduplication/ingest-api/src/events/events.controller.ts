/**
 * HTTP/Kafka controller — routes delegate to service.
 * (EN: Controller — routes delegate to service.)
 */
}

    @Post()
/**
 * Logic — xử lý demo cho `publish`.
 * (EN: Logic — demo handler for `publish`.)
 */
    /**
     * Logic — HTTP → Kafka producer.
     * (EN Logic: HTTP → Kafka producer.)
     */
    async publish(@Body() body: PublishEventDto): Promise<ReturnType<EventsService["publish"]>> {
        return this.events.publish(body)
    }
