import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from "@nestjs/common"
import {
    Observable,
} from "rxjs"
import {
    delay,
} from "rxjs/operators"
import {
    envConfig,
} from "@modules/platform/env/config"

@Injectable()
/**
 * Delays every mock response by a configured amount so lesson sandboxes show
 * their loading/skeleton states (real APIs are never instant). Tunable via
 * `MOCK_DELAY_MS` (default 1000ms). Preflight OPTIONS never reach here.
 */
export class MockDelayInterceptor implements NestInterceptor {
    intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
        // pull the configured artificial latency and delay the response stream
        const delayMs = envConfig().services.mock.delayMs
        return next.handle().pipe(delay(delayMs))
    }
}
