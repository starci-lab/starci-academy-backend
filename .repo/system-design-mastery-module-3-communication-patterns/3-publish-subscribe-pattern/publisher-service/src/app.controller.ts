/**
 * Controller — routes delegate to service.
 */
}

    /**
     * Logic — Receives POST /publish, calls service to emit NATS event on `app.events` topic.
     * Code — `@Post("publish")` maps endpoint, delegates to `AppService.publish`.
     */
    @Post("publish")
    publish(@Body() body: PublishRequestBody): Promise<PublishResponse> {
        this.logger.log("Received publish request")
        return this.appService.publish(body)
    }
