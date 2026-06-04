/**
 * Controller — routes delegate to service.
 */
}

    /**
     * Logic — Receives `app.events`, calls service to send email/push notification.
     * Code — `@EventPattern` listens on NATS subject, `@Payload()` extracts data.
     */
    @EventPattern("app.events")
    handle(@Payload() data: AppEventEnvelope): void {
        this.logger.log(`notification: ${JSON.stringify(data)}`)
        this.appService.processEvent(data)
    }
