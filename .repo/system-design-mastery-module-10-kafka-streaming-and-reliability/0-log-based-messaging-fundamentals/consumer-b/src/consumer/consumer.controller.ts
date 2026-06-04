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
     * Logic: Consumer group receives messages; delegates to ConsumerService.
     */
    @EventPattern("platform-events")
    async handle(@Payload() data: Record<string, string | number | boolean>): Promise<void> {
        return this.consumer.process(data)
    }
}
