import {
    CanActivate,
    Injectable,
} from "@nestjs/common"
import {
    envConfig,
} from "@modules/platform/env/config"
import {
    ToolsRouteNotFoundException,
} from "@modules/platform/exceptions/errors/guards/tools-route-not-found"

@Injectable()
/**
 * Guard that hard-blocks every tools route in production.
 *
 * The ops console is meant to run only on an operator's local machine. If the
 * `apps/tools` service is ever started with `NODE_ENV=production`, every guarded
 * route answers `404 Not Found` so the endpoints are indistinguishable from
 * routes that do not exist -- this is the API-layer half of the prod lockdown
 * (the static `/dashboard` is gated by a sibling middleware in `main.ts`).
 */
export class LocalOnlyGuard implements CanActivate {
    /**
     * Allow the request only when not running in production.
     *
     * @returns true when the route may proceed (non-production).
     */
    canActivate(): boolean {
        // pretend the route does not exist when deployed to production
        if (envConfig().isProduction) {
            throw new ToolsRouteNotFoundException({
            })
        }
        // local/dev -- let the tool run
        return true
    }
}
