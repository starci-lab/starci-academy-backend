/**
 * HTTP/Kafka controller — routes delegate to service.
 * (EN: Controller — routes delegate to service.)
 */
import {
    Body,
    Controller,
    Post,
} from "@nestjs/common"
import {
    EventsService,
} from "./events.service"
import {
    PublishEventDto,
} from "./dto"

@Controller("events")
export class EventsController {
    constructor(
        private readonly events: EventsService,
    ) {}

    /**
     * Logic — HTTP → Kafka producer.
     * (EN Logic: HTTP → Kafka producer.)
     */
    @Post()
    async publish(@Body() body: PublishEventDto): Promise<ReturnType<EventsService["publish"]>> {
        return this.events.publish(body)
    }
}
