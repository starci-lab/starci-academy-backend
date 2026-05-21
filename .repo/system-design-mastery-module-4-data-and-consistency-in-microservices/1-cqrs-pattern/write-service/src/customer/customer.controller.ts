/**
 * HTTP/Kafka controller — routes delegate to service.
 * (EN: Controller — routes delegate to service.)
 */
}

    @Post("update")
    async update(
        @Body() body: { id: string; name: string; email: string },
    ): Promise<unknown> {
        this.logger.log(`Received update request for customer "${body.id}"`)
        return this.commandBus.execute(
            new UpsertCustomerCommand(body.id, body.name, body.email),
        )
    }
}
