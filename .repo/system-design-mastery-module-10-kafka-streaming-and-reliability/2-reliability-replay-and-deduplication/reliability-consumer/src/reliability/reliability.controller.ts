import {
    ConflictException,
    Controller,
    Logger,
} from "@nestjs/common"
import {
    EventPattern,
    Payload,
} from "@nestjs/microservices"
import {
    QueryFailedError,
} from "typeorm"
import {
    ReliabilityService,
} from "./reliability.service"
import type {
    ProcessEventPayload,
} from "./dto"

/**
 * Kafka consumer controller — handles reliability-events topic.
 */
@Controller()
export class ReliabilityController {
    private readonly logger = new Logger(ReliabilityController.name)

    constructor(
        private readonly reliability: ReliabilityService,
    ) {}

    /**
     * Logic: Consume Kafka event and process idempotently.
     * Code: EventPattern → processEvent.
     */
    @EventPattern("reliability-events")
    async handle(@Payload() data: ProcessEventPayload): Promise<void> {
        try {
            await this.reliability.processEvent(data)
        } catch (error) {
            // Duplicate (Redis SETNX miss OR Postgres unique-constraint 23505) → idempotent skip.
            // Commit offset by returning normally; throwing would cause KafkaJS infinite retry
            // and head-of-line-block subsequent messages.
            if (this.isDuplicateError(error)) {
                const id = data?.clientMessageId ?? "<unknown>"
                this.logger.log(`Duplicate skipped clientMessageId=${id}`)
                return
            }
            // Real processing error → park the poison message into the DLQ topic and commit.
            // Publishing to the DLQ then committing isolates the bad message for manual replay
            // instead of throwing (which would retry forever and head-of-line-block the partition).
            const message = error instanceof Error ? error.message : "Unknown error"
            this.logger.error(`Failed: ${message} — will retry / DLQ via Kafka`)
            await this.reliability.publishToDlq(data)
            const id = data?.clientMessageId ?? "<unknown>"
            this.logger.warn(`Routed to DLQ reliability-events-dlq clientMessageId=${id}`)
        }
    }

    /**
     * Detect duplicate: NestJS ConflictException (Redis SETNX miss) OR
     * Postgres unique_violation (SQLSTATE 23505) raised by TypeORM.
     */
    private isDuplicateError(error: unknown): boolean {
        if (error instanceof ConflictException) return true
        if (error instanceof QueryFailedError) {
            const driverErr = (error as QueryFailedError & { code?: string }).code
                ?? (error as unknown as { driverError?: { code?: string } }).driverError?.code
            if (driverErr === "23505") return true
        }
        return false
    }
}
