import {
    Args,
    Mutation,
    Resolver,
} from "@nestjs/graphql"
import {
    UseGuards,
    UseInterceptors,
} from "@nestjs/common"
import {
    GraphQLSuccessMessage,
    GraphQLTransformInterceptor,
} from "@modules/api/apollo/server/interceptors/graphql-transform.interceptor"
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
    KeycloakAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"
import {
    KeycloakGraphQLUser,
} from "@modules/integrations/keycloak/keycloak.decorators"
import {
    DisableTwoFactorRequest,
} from "./graphql-types/request"
import {
    DisableTwoFactorResponse,
} from "./graphql-types/response"
import {
    DisableTwoFactorService,
} from "./disable-two-factor.service"

@Resolver()
/**
 * Disable two-factor (TOTP) for the current user, clearing the stored secret.
 *
 * While 2FA is enabled, a valid code is required to prove device ownership
 * before turning it off. When it is already disabled, the call is idempotent and
 * just clears any leftover pending secret.
 */
export class DisableTwoFactorResolver {
    constructor(
        private readonly disableTwoFactorService: DisableTwoFactorService,
    ) {}

    @UseThrottler(ThrottlerConfig.Strict)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Two-factor authentication disabled",
        [Locale.Vi]: "Đã tắt xác thực hai lớp", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => DisableTwoFactorResponse,
        {
            name: "disableTwoFactor",
            description: "Disable 2FA (requires a valid TOTP code while enabled) and clear the secret.",
        },
    )
    async execute(
        @Args("request")
            request: DisableTwoFactorRequest,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<undefined> {
        return this.disableTwoFactorService.execute({
            request,
            user,
        })
    }
}
