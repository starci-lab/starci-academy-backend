/**
 * HTTP/Kafka controller — routes delegate to service.
 * (EN: Controller — routes delegate to service.)
 */
}

    @Get()
/**
 * Logic — xử lý demo cho `getRecords`.
 * (EN: Logic — demo handler for `getRecords`.)
 */
    async getRecords(: Promise<ReturnType<FailoverService["findAll"]>> {
        return this.service.findAll()
    }

    @Post()
    async createRecord(@Body() dto: CreateFailoverDto: Promise<ReturnType<FailoverService["create"]>> {
        return this.service.create(dto)
    }
