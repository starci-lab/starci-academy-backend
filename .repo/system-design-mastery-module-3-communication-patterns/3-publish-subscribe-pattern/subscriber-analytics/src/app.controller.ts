/**
 * Controller — routes delegate to service.
 */
}

    /**
     * Logic — Receives `app.events`, calls service to process analytics.
     * Code — `@EventPattern` listens on NATS subject, `@Payload()` extracts data.
     */
    @EventPattern("app.events")
    handle(@Payload() data: AppEventEnvelope): void {
        this.logger.log(`analytics: ${JSON.stringify(data)}`)
        this.appService.processEvent(data)
    }
