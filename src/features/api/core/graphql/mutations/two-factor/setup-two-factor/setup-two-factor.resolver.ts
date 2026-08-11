import {
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
    SetupTwoFactorData,
    SetupTwoFactorResponse,
} from "./graphql-types/response"
import {
    SetupTwoFactorService,
} from "./setup-two-factor.service"

@Resolver()
/**
 * Start two-factor (TOTP) enrollment for the current user.
 *
 * Generates a fresh secret, stores it encrypted as the *pending* secret, and
 * returns the base32 secret + otpauth URI so the client can render a QR. Setup
 * leaves 2FA disabled until {@link confirmTwoFactor} verifies a code, so calling
 * it again (re-enrollment) safely turns the flag off until the new secret is
 * confirmed.
 */
export class SetupTwoFactorResolver {
    constructor(
        private readonly setupTwoFactorService: SetupTwoFactorService,
    ) {}

    @UseThrottler(ThrottlerConfig.Strict)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Two-factor setup started",
        [Locale.Vi]: "Đã bắt đầu thiết lập xác thực hai lớp", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => SetupTwoFactorResponse,
        {
            name: "setupTwoFactor",
            description: "Start TOTP enrollment; returns the secret + otpauth URI for the QR.",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<SetupTwoFactorData> {
        return this.setupTwoFactorService.execute({
            request: undefined,
            user,
        })
    }
}
