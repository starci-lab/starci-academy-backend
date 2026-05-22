import {
    Injectable,
    Logger,
} from "@nestjs/common"
import * as os from "os"

@Injectable()
export class StatusService {
    private readonly logger = new Logger(StatusService.name)
    private requestCount = 0
    private readonly startTime = Date.now()

    getStatus(): { status: string; servedBy: string; timestamp: string } {
        this.requestCount++
        const hostname = os.hostname()
        this.logger.log(`Request handled by: ${hostname}`)
        return { status: "ok", servedBy: hostname, timestamp: new Date().toISOString() }
    }

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
        this.requestCount++
        this.logger.log(`[${hostname}] Heavy task completed in ${duration}ms`)
        return { servedBy: hostname, duration: `${duration}ms`, iterations, result: "completed" }
    }

    getMetrics(): {
        servedBy: string
        requestCount: number
        uptimeSeconds: number
        memoryUsageMB: number
        timestamp: string
    } {
        this.requestCount++
        const hostname = os.hostname()
        const uptimeSeconds = Math.floor((Date.now() - this.startTime) / 1000)
        const memoryUsageMB = Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100
        return {
            servedBy: hostname,
            requestCount: this.requestCount,
            uptimeSeconds,
            memoryUsageMB,
            timestamp: new Date().toISOString(),
        }
    }
}
