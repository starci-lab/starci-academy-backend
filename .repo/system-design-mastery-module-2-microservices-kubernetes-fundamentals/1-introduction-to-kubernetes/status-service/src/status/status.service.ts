/**
 * Service lesson — methods documented Logic + Code (§4).
 * (EN: Lesson service — Logic + Code on methods (§4).)
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
 * Service logic chính của lesson.
 * (EN: Core lesson service logic.)
 */
@Injectable()
export class StatusService {
    private readonly logger = new Logger(StatusService.name)

/**
 * Logic — Trả health + hostname để demo load balancer / nhiều replica.
 * Code — `os.hostname()` + object `{ status, servedBy, timestamp }`.
 * (EN Logic: Return health and hostname for load-balancer demos.)
 * (EN Code: `os.hostname()` plus `{ status, servedBy, timestamp }`.)
 */
    getStatus() {
        // Hostname trùng tên Pod trong phần lớn trường hợp (EN: hostname often matches Pod name)
        const hostname = os.hostname()

        // Log kịch bản: Pod nào đang phục vụ (EN: which Pod served the request)
        this.logger.log(`[${hostname}] xử lý GET /api/status (EN: handled GET /api/status)`)

        return {
            status: "ok",
            servedBy: hostname,
            timestamp: new Date().toISOString(),
        }
    }
}
