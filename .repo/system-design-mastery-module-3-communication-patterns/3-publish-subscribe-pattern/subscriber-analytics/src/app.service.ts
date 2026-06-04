/**
 * Analytics Service — updates metrics/statistics from received events.
 */
import {
    Injectable,
    Logger,
} from "@nestjs/common"
import type {
    AppEventEnvelope,
} from "./types"

@Injectable()
/**
 * Class `AppService` — lesson lab component.
 */
export class AppService {
    private readonly logger = new Logger(AppService.name)

    /**
     * Logic — Updates analytics metrics for event type (mock, log only).
     * Code — Receives payload, extracts `type`, logs to console.
     */
    processEvent(data: AppEventEnvelope): void {
        const t = data.type
        this.logger.log(`Updating metrics for event type: ${String(t)}`)
    }
}
