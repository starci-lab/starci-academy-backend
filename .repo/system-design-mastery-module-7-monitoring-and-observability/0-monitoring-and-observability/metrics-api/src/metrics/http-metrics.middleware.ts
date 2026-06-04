/**
 * Middleware measuring duration and counting HTTP requests for Prometheus (method/route/status labels).
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
 * Normalize route label from Express/Nest for stable metric grouping.
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
        // Join baseUrl + route template; strip trailing slashes except root.
        return combined.replace(/\/+$/,
            "") || combined || req.path
    }
    return req.path ?? req.url.split("?")[0] ?? "unknown"
}

@Injectable()
export class HttpMetricsMiddleware implements NestMiddleware {
    /**
     * Attach `finish` listener; record counter + histogram when response ends.
     */
    use(req: Request, res: Response, next: NextFunction): void {
        const start = process.hrtime.bigint()
        res.on("finish",
            () => {
                const route = resolveRoute(req)
                // Latency from bigint nanoseconds converted to seconds (float).
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
