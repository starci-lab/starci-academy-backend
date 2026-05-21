/**
 * Service lesson — CPU stress + status cho scaling demo.
 * (EN: Lesson service — CPU stress + status for scaling demo.)
 */
import {
    Injectable,
    Logger,
} from "@nestjs/common"
import * as os from "os"

@Injectable()
export class TaskService {
    private readonly logger = new Logger(TaskService.name)

    /**
     * Logic — stress CPU để so sánh scale vertical/horizontal.
     * Code — vòng sqrt/atan + đo duration ms.
     * (EN Logic: CPU stress for vertical vs horizontal scaling.)
     * (EN Code: sqrt/atan loop + duration timing.)
     */
    runHeavyCalculation(iterations: number): {
        servedBy: string
        duration: string
        iterations: number
        result: string
    } {
        const start = Date.now()
        let result = 0
        for (let i = 0; i < iterations; i++) {
            result += Math.sqrt(i) * Math.atan(i)
        }
        const duration = Date.now() - start
        const hostname = os.hostname()
        this.logger.log(`[${hostname}] Heavy task completed in ${duration}ms`)
        return { servedBy: hostname, duration: `${duration}ms`, iterations, result: "completed" }
    }

    /**
     * Logic — health check node đang xử lý request.
     * Code — `os.hostname()` trong response.
     * (EN Logic: Health of node serving requests.)
     * (EN Code: `os.hostname()` in response.)
     */
    getStatus(): { status: string; servedBy: string; timestamp: string } {
        return { status: "ok", servedBy: os.hostname(), timestamp: new Date().toISOString() }
    }
}
