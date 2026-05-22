import {
    Controller,
    Logger,
} from "@nestjs/common"
import {
    EventPattern,
    Payload,
} from "@nestjs/microservices"
import {
    ReliabilityService,
} from "./reliability.service"
import type {
    ProcessEventPayload,
} from "./dto"

/**
 * Kafka consumer controller — xử lý topic reliability-events.
 * (EN: Kafka consumer controller — handles reliability-events topic.)
 */
@Controller()
export class ReliabilityController {
    private readonly logger = new Logger(ReliabilityController.name)

    constructor(
        private readonly reliability: ReliabilityService,
    ) {}

    /**
     * Logic — nhận event Kafka, gọi idempotent processEvent.
     * Code — @EventPattern → ReliabilityService.processEvent.
     * (EN Logic: Consume Kafka event and process idempotently.)
     * (EN Code: EventPattern → processEvent.)
     */
    @EventPattern("reliability-events")
    async handle(@Payload() data: ProcessEventPayload): Promise<void> {
        try {
            await this.reliability.processEvent(data)
        } catch (error) {
            const message = error instanceof Error ? error.message : "Unknown error"
            this.logger.error(`Failed: ${message} — will retry / DLQ via Kafka`)
            throw error
        }
    }
}
