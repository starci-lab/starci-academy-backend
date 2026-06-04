/**
 * Controller — routes delegate to service.
 */
}

    /**
     * Logic — Receives `app.events`, calls service to write audit log.
     * Code — `@EventPattern` listens on NATS subject, `@Payload()` extracts data.
     */
    @EventPattern("app.events")
    handle(@Payload() data: AppEventEnvelope): void {
        this.logger.log(`audit: ${JSON.stringify(data)}`)
        this.appService.processEvent(data)
    }
