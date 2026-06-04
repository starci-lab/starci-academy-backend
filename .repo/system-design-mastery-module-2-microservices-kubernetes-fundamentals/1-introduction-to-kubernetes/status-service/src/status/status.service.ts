/**
 * Lesson service — Logic + Code on methods (§4).
 */
import {
    Injectable,
    Logger,
} from "@nestjs/common"
import {
    Logger,
} from "@nestjs/common"
import * as os from "os"

/**
 * Core lesson service logic.
 */
@Injectable()
export class StatusService {
    private readonly logger = new Logger(StatusService.name)

/**
 * Logic — Return health and hostname for load-balancer demos.
 * Code — `os.hostname()` plus `{ status, servedBy, timestamp }`.
 */
    getStatus() {
        // hostname often matches Pod name
        const hostname = os.hostname()

        // which Pod served the request
        this.logger.log(`[${hostname}] xử lý GET /api/status (EN: handled GET /api/status)`)

        return {
            status: "ok",
            servedBy: hostname,
            timestamp: new Date().toISOString(),
        }
    }
}
