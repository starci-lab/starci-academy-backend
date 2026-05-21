import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from "@nestjs/common"
import {
    Observable 
} from "rxjs"
import {
    finalize 
} from "rxjs/operators"
import {
    MetricsService 
} from "."

@Injectable()
export class MetricsHttpInterceptor implements NestInterceptor {
    constructor(private readonly metrics: MetricsService) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
        const http = context.switchToHttp()
        const req = http.getRequest<{ method: string; url: string }>()
        const res = http.getResponse<{ statusCode: number }>()
        const path = String(req.url || "").split("?")[0] || "unknown"
        if (path === "/metrics") {
            return next.handle()
        }
        // prom-client: histogram.startTimer(...) rồi end({ ...labels }) (EN: prom-client histogram.startTimer then end with labels).
        const endDuration = this.metrics.startHttpDurationTimer(req.method,
            path)
        return next.handle().pipe(
            finalize(() => {
                const status = String(res.statusCode)
                endDuration({
                    status_code: status 
                })
                this.metrics.incrementHttpRequestCount(req.method,
                    path,
                    status)
            }),
        )
    }
}
