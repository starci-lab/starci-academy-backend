import {
    ThrottlerGuard
} from "@nestjs/throttler"
import type {
    ThrottlerLimitDetail,
} from "@nestjs/throttler"
import {
    ExecutionContext,
    Injectable
} from "@nestjs/common"
import {
    GqlExecutionContext
} from "@nestjs/graphql"
import type {
    GraphQLRequestResponseContext,
    ThrottlerTrackedParams,
} from "../types/request-response"
import {
    RateLimitExceededException,
} from "@modules/platform/exceptions/errors/guards/rate-limit-exceeded"
import {
    envConfig,
} from "@modules/platform/env/config"

/**
 * Build the throttle tracker while keeping parallel local UAT origins independent.
 * Production remains IP-only; the local suffix is exact and cannot broaden a deployed key.
 */
export const toThrottleTracker = (
    req: ThrottlerTrackedParams,
    nodeEnv = envConfig().nodeEnv,
): string => {
    const ip = req.ips?.length ? req.ips[0] : (req.ip ?? "")
    if (nodeEnv === "production") return ip
    const origin = req.headers?.origin
    if (typeof origin !== "string") return ip
    try {
        const hostname = new URL(origin).hostname
        return hostname.endsWith(".lvh.me") ? `${ip}|${hostname}` : ip
    } catch {
        return ip
    }
}

@Injectable()
/**
 * Global rate-limit guard that works behind a reverse proxy AND across both
 * REST (HTTP) and GraphQL execution contexts.
 *
 * - {@link getTracker} keys the limit on the real client IP (first
 *   `X-Forwarded-For` hop when present, else the socket address).
 * - {@link getRequestResponse} is overridden so the guard can pull req/res out
 *   of the GraphQL context (the stock guard only understands HTTP), which is
 *   required now that it runs as a global APP_GUARD over GraphQL resolvers too.
 */
export class ThrottlerBehindProxyGuard extends ThrottlerGuard {
    /**
     * Keep throttling a stable application verdict across REST and GraphQL.
     * The stock guard throws a Nest HttpException, which Apollo otherwise
     * classifies as an unexpected 500 after auto HTTP transforms are disabled.
     */
    protected async throwThrottlingException(
        _context: ExecutionContext,
        detail: ThrottlerLimitDetail,
    ): Promise<void> {
        const rawRetryAfter = detail.timeToBlockExpire || detail.timeToExpire
        throw new RateLimitExceededException({
            retryAfterSeconds: Number.isFinite(rawRetryAfter) && rawRetryAfter > 0
                ? Math.ceil(rawRetryAfter)
                : undefined,
        })
    }

    /**
     * Tracks requests per real client IP.
     *
     * @param req - The incoming request record.
     * @returns The client IP used as the throttle key.
     */
    protected async getTracker(req: ThrottlerTrackedParams): Promise<string> {
        // prefer the first proxied IP, else fall back to the socket address
        return toThrottleTracker(req)
    }

    /**
     * Resolves the underlying req/res pair across transports so the guard can
     * read headers and set rate-limit response headers.
     *
     * @param context - The Nest execution context.
     * @returns The request/response pair for the active transport.
     */
    protected getRequestResponse(context: ExecutionContext): GraphQLRequestResponseContext {
        // GraphQL keeps req/res on the gql context, not the HTTP argument host
        if (context.getType<string>() === "graphql") {
            const gqlContext = GqlExecutionContext.create(context).getContext<GraphQLRequestResponseContext>()
            return {
                req: gqlContext.req,
                res: gqlContext.res,
            }
        }
        // REST path -> defer to the stock HTTP resolution
        return super.getRequestResponse(context)
    }
}
