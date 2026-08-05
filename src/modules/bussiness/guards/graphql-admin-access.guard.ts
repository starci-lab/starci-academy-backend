import {
    CanActivate,
    ExecutionContext,
    Injectable,
} from "@nestjs/common"
import {
    GqlExecutionContext,
} from "@nestjs/graphql"
import {
    MountStorageService,
} from "@modules/filesystem"
import {
    AdminApiKeyNotConfiguredException,
    AdminApiKeyRequiredException,
    InvalidAdminApiKeyException,
} from "@modules/exceptions"

@Injectable()
/**
 * GraphQL counterpart of {@link AdminAccessGuard} — grants access only when the
 * `x-admin-api-key` header matches the mounted admin secret.
 *
 * GraphQL resolvers have no HTTP request on `switchToHttp()`; the request lives
 * on the Apollo context (`context.req`). Used to gate operator-only queries
 * (system health, balancer key status) that would otherwise leak live infra /
 * key state to the public.
 */
export class GraphQLAdminAccessGuard implements CanActivate {
    constructor(
        private readonly mountStorageService: MountStorageService,
    ) { }

    /**
     * Read the mounted admin API key (rejects an empty/unmounted secret so the
     * gate fails closed rather than accepting any header).
     */
    private readAdminApiKey(): string {
        const key = this.mountStorageService.adminApiKey
        if (!key) {
            throw new AdminApiKeyNotConfiguredException({
            })
        }
        return key
    }

    /**
     * Validate the `x-admin-api-key` header on the GraphQL request context.
     */
    canActivate(context: ExecutionContext): boolean {
        const gqlContext = GqlExecutionContext.create(context).getContext<{
            req?: { headers?: Record<string, string | Array<string> | undefined> }
        }>()
        const headerValue = gqlContext.req?.headers?.["x-admin-api-key"]
        const apiKey = Array.isArray(headerValue)
            ? headerValue[0]
            : headerValue
        if (!apiKey) {
            throw new AdminApiKeyRequiredException({
            })
        }
        if (apiKey !== this.readAdminApiKey()) {
            throw new InvalidAdminApiKeyException({
            })
        }
        return true
    }
}
