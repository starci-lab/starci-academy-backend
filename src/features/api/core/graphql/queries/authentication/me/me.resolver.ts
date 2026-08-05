import {
    Query,
    Resolver,
} from "@nestjs/graphql"
import {
    UseGuards,
    UseInterceptors,
} from "@nestjs/common"
import {
    GraphQLLocale,
} from "@modules/api/apollo/server/decorators/locale.decorators"
import {
    GraphQLSuccessMessage,
    GraphQLTransformInterceptor,
} from "@modules/api/apollo/server/interceptors/graphql-transform.interceptor"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"
import {
    KeycloakGraphQLUser,
} from "@modules/integrations/keycloak/keycloak.decorators"
import {
    ThrottlerConfig,
} from "@modules/platform/throttler/enums/throttler-config"
import {
    UseThrottler,
} from "@modules/platform/throttler/throttler.decorators"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    MeResponse,
} from "./graphql-types/response"
import {
    MeService,
} from "./me.service"

@Resolver()
/**
 * Authenticated `me` query -- returns the Keycloak-backed user and lets
 * the handler bootstrap a local row on first valid-token access. Soft-
 * throttled; the FE calls this on every authenticated shell mount.
 */
export class MeResolver {
    constructor(
        private readonly meService: MeService,
    ) {}

    /**
     * Returns the current user; creates a local row on first access when token is valid.
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Me fetched successfully",
        [Locale.Vi]: "Lấy thông tin người dùng thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(() => MeResponse,
        {
            name: "me",
            description: "Returns the authenticated user (Bearer access token).",
        })
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
        @GraphQLLocale()
            locale: Locale,
    ): Promise<UserEntity> {
        return this.meService.execute({
            request: undefined,
            locale,
            user,
        })
    }
}
