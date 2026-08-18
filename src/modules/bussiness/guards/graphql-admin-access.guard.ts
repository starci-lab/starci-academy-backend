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
} from "@modules/filesystem/mount-storage.service"
import {
    AdminApiKeyNotConfiguredException,
} from "@modules/platform/exceptions/errors/guards/admin-api-key-not-configured"
import {
    AdminApiKeyRequiredException,
} from "@modules/platform/exceptions/errors/guards/admin-api-key-required"
import {
    InvalidAdminApiKeyException,
} from "@modules/platform/exceptions/errors/guards/invalid-admin-api-key"
import type {
    GraphQLHeaderOnlyContext,
} from "./types/graphql-context"

@Injectable()
/**
 * GraphQL counterpart of {@link AdminServiceTokenGuard} -- grants access only when the
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
        const gqlContext = GqlExecutionContext.create(context)
            .getContext<GraphQLHeaderOnlyContext>()
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
