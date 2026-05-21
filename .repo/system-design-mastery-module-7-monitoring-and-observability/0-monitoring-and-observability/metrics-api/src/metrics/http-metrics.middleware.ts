/**
 * Middleware đo thời gian và đếm request HTTP cho Prometheus (labels method/route/status).
 * (EN: Middleware measuring duration and counting HTTP requests for Prometheus (method/route/status labels).)
 */
import {
    Injectable, NestMiddleware 
} from "@nestjs/common"
import type {
    NextFunction, Request, Response 
} from "express"
import {
    httpRequestDurationSeconds, httpRequestsTotal 
} from "../prometheus"

/**
 * Chuẩn hoá nhãn route từ Express/Nest để nhóm metric ổn định.
 * (EN: Normalize route label from Express/Nest for stable metric grouping.)
 */
function resolveRoute(req: Request): string {
    const routePath = req.route?.path
    if (routePath !== undefined) {
        const base = req.baseUrl ?? ""
        const suffix =
            typeof routePath === "string"
                ? routePath === "/" || routePath === ""
                    ? ""
                    : routePath
                : ""
        const combined = `${base}${suffix}` || req.path
        // Gộp baseUrl + route template; bỏ slash thừa cuối chuỗi (trừ root).
        // (EN: Join baseUrl + route template; strip trailing slashes except root.)
        return combined.replace(/\/+$/,
            "") || combined || req.path
    }
    return req.path ?? req.url.split("?")[0] ?? "unknown"
}

@Injectable()
export class HttpMetricsMiddleware implements NestMiddleware {
    /**
     * Gắn listener `finish`, ghi counter + histogram khi response kết thúc.
     * (EN: Attach `finish` listener; record counter + histogram when response ends.)
     */
    use(req: Request, res: Response, next: NextFunction): void {
        const start = process.hrtime.bigint()
        res.on("finish",
            () => {
                const route = resolveRoute(req)
                // Độ trễ tính bằng bigint nanosecond → quy đổi sang giây (float).
                // (EN: Latency from bigint nanoseconds converted to seconds (float).)
                const durationSec = Number(process.hrtime.bigint() - start) / 1e9
                const statusCode = String(res.statusCode)
                httpRequestsTotal.inc({
                    method: req.method,
                    route,
                    status_code: statusCode,
                })
                httpRequestDurationSeconds.observe(
                    {
                        method: req.method, route 
                    },
                    durationSec,
                )
            })
        next()
    }
}
