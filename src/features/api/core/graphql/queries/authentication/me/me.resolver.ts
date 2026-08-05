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
    GraphQLSuccessMessage,
    GraphQLTransformInterceptor,
} from "@modules/api"
import {
    KeycloakAuthGraphQLGuard,
    KeycloakGraphQLUser,
} from "@modules/keycloak"
import {
    UseThrottler,
    ThrottlerConfig,
} from "@modules/throttler"
import {
    Locale,
    UserEntity,
} from "@modules/databases"
import {
    MeResponse,
} from "./graphql-types"
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
