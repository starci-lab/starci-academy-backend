/**
 * Audit Service — writes event to audit log database (mock).
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
     * Logic — Writes event to audit log (mock, log only).
     * Code — Receives payload, extracts `type`, logs to console.
     */
    processEvent(data: AppEventEnvelope): void {
        const t = data.type
        this.logger.log(`Saving event to audit log database: ${String(t)}`)
    }
}
