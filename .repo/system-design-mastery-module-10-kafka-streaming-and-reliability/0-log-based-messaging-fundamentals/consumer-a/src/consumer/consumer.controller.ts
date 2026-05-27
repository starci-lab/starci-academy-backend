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
     * Logic — consumer group nhận message từ topic; delegate sang ConsumerService.
     * Code — @EventPattern + @Payload → process().
     * (EN Logic: Consumer group receives topic messages; delegates to ConsumerService.)
     * (EN Code: @EventPattern + @Payload → process().)
     */
    @EventPattern("platform-events")
    async handle(@Payload() data: Record<string, string | number | boolean>): Promise<void> {
        return this.consumer.process(data)
    }
}
