import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from "@nestjs/common"
import {
    GqlContextType,
    GqlExecutionContext,
} from "@nestjs/graphql"
import {
    Observable,
} from "rxjs"
import {
    delay,
} from "rxjs/operators"
import {
    envConfig,
} from "@modules/env"

@Injectable()
/**
 * Dev-only: artificially delays every API response by a configured amount so the
 * frontend can exercise its loading / skeleton states (real APIs are never
 * instant). Registered globally in the core bootstrap.
 *
 * HARD-DISABLED in production and OFF by default -- enable per-environment with
 * `API_RESPONSE_DELAY_ENABLE=true` (latency `API_RESPONSE_DELAY_MS`, default 5000ms).
 *
 * Because it runs globally it also wraps GraphQL resolvers; the delay is applied
 * ONLY to the root operation (query/mutation field), never to nested `@ResolveField`
 * resolvers, so a deep query is delayed once -- not once per resolver.
 */
export class ResponseDelayInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
        const config = envConfig()
        const { enable, ms } = config.services.api.responseDelay
        // never in production; only when explicitly enabled with a positive delay
        if (config.isProduction || !enable || ms <= 0) {
            return next.handle()
        }
        // GraphQL: skip nested field resolvers so the latency isn't stacked per resolver;
        // only the root operation (no parent in the resolve path) carries the delay.
        if (context.getType<GqlContextType>() === "graphql") {
            const info = GqlExecutionContext.create(context).getInfo<{ path?: { prev?: unknown } }>()
            if (info?.path?.prev) {
                return next.handle()
            }
        }
        return next.handle().pipe(delay(ms))
    }
}
