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
    ConfirmTwoFactorRequest,
} from "./graphql-types/request"
import {
    ConfirmTwoFactorResponse,
} from "./graphql-types/response"
import {
    ConfirmTwoFactorService,
} from "./confirm-two-factor.service"

@Resolver()
/**
 * Confirm two-factor (TOTP) setup by verifying a code against the pending
 * secret, then enabling the flag. Rejects with a typed exception when there is
 * no pending secret or the code does not match within the skew window.
 */
export class ConfirmTwoFactorResolver {
    constructor(
        private readonly confirmTwoFactorService: ConfirmTwoFactorService,
    ) {}

    @UseThrottler(ThrottlerConfig.Strict)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Two-factor authentication enabled",
        [Locale.Vi]: "Đã bật xác thực hai lớp", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => ConfirmTwoFactorResponse,
        {
            name: "confirmTwoFactor",
            description: "Verify a TOTP code against the pending secret and enable 2FA.",
        },
    )
    async execute(
        @Args("request")
            request: ConfirmTwoFactorRequest,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<undefined> {
        return this.confirmTwoFactorService.execute({
            request,
            user,
        })
    }
}
