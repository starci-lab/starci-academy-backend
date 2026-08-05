import {
    Args,
    Mutation,
    Resolver,
} from "@nestjs/graphql"
import {
    UseGuards,
    UseInterceptors,
} from "@nestjs/common"
import type {
    EntityManager,
} from "typeorm"
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
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"
import {
    KeycloakGraphQLUser,
} from "@modules/integrations/keycloak/keycloak.decorators"
import {
    EncryptionService,
} from "@modules/crypto/encryption.service"
import {
    TotpService,
} from "@modules/integrations/totp/totp.service"
import {
    TwoFactorInvalidCodeException,
} from "@modules/platform/exceptions/errors/api/two-factor-invalid-code"
import {
    DisableTwoFactorRequest,
} from "./graphql-types/request"
import {
    DisableTwoFactorResponse,
} from "./graphql-types/response"

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
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly totpService: TotpService,
        private readonly encryptionService: EncryptionService,
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
    ): Promise<DisableTwoFactorResponse> {
        // reload to read the authoritative enabled flag + stored secret
        const current = await this.entityManager.findOneByOrFail(
            UserEntity,
            {
                id: user.id,
            },
        )

        // while enabled, require a valid code so a hijacked session can't silently
        // strip the second factor
        if (current.twoFactorEnabled && current.twoFactorSecret) {
            const secret = this.encryptionService.decrypt({
                payload: JSON.parse(current.twoFactorSecret),
            })
            const valid = this.totpService.verify({
                secret,
                token: request.code,
            })
            if (!valid) {
                throw new TwoFactorInvalidCodeException({
                    userId: user.id,
                })
            }
        }

        // clear both the flag and the secret (also drops any pending enrollment)
        await this.entityManager.update(
            UserEntity,
            {
                id: user.id,
            },
            {
                twoFactorEnabled: false,
                twoFactorSecret: null,
            },
        )

        return {
        } as DisableTwoFactorResponse
    }
}
