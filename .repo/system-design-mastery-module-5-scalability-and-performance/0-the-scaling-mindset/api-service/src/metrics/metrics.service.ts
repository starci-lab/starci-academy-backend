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

/**
 * Service logic chính của lesson.
 * (EN: Core lesson service logic.)
 */
@Injectable()
export class MetricsService {
    private readonly logger = new Logger(MetricsService.name)

/**
 * Logic — Xử lý nghiệp vụ `startHttpDurationTimer` cho lab.
 * Code — `startHttpDurationTimer()` — logic trong service/controller.
 * (EN Logic: Business handler `startHttpDurationTimer` for the lab.)
 * (EN Code: `startHttpDurationTimer()` — in-class handler logic.)
 */
    startHttpDurationTimer(method: string, route: string) {
        return this.httpRequestDurationSeconds.startTimer({
            method, route 
        })
    }

    /**
 * Logic — Xử lý nghiệp vụ `incrementHttpRequestCount` cho lab.
 * Code — `incrementHttpRequestCount()` — logic trong service/controller.
 * (EN Logic: Business handler `incrementHttpRequestCount` for the lab.)
 * (EN Code: `incrementHttpRequestCount()` — in-class handler logic.)
 */
    incrementHttpRequestCount(
        method: string,
        route: string,
        statusCode: string,
    ): void {
        this.httpRequestsTotal.inc({
            method,
            route,
            status_code: statusCode,
        })
    }
/**
 * Logic — Xử lý nghiệp vụ `metricsText` cho lab.
 * Code — `async metricsText()` — gọi dependency inject / client.
 * (EN Logic: Business handler `metricsText` for the lab.)
 * (EN Code: `async metricsText()` — uses injected deps / clients.)
 */
    async metricsText(): Promise<string> {
        return await this.register.metrics()
    }
}
