/**
 * HTTP/Kafka controller — routes delegate to service.
 * (EN: Controller — routes delegate to service.)
 */
import {
    Controller,
} from "@nestjs/common"
import {
    EventPattern,
    Payload,
} from "@nestjs/microservices"
import {
    ConsumerService,
} from "./consumer.service"

@Controller()
export class ConsumerController {
    constructor(
        private readonly consumer: ConsumerService,
    ) {}

    /**
     * Logic — cùng consumer group; so sánh lag fast vs slow trên UI.
     * (EN Logic: Same consumer group; compare fast vs slow lag in UI.)
     */
    @EventPattern("ordering-events")
    async handle(@Payload() data: Record<string, string | number | boolean>): Promise<void> {
        return this.consumer.process(data)
    }
}
