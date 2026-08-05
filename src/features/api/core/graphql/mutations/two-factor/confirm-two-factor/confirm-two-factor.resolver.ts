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
    ConfirmTwoFactorRequest,
} from "./graphql-types/request"
import {
    ConfirmTwoFactorResponse,
} from "./graphql-types/response"

@Resolver()
/**
 * Confirm two-factor (TOTP) setup by verifying a code against the pending
 * secret, then enabling the flag. Rejects with a typed exception when there is
 * no pending secret or the code does not match within the skew window.
 */
export class ConfirmTwoFactorResolver {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly totpService: TotpService,
        private readonly encryptionService: EncryptionService,
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
    ): Promise<ConfirmTwoFactorResponse> {
        // reload the row to read the pending encrypted secret (the guard snapshot
        // may predate setupTwoFactor within the same session)
        const current = await this.entityManager.findOneByOrFail(
            UserEntity,
            {
                id: user.id,
            },
        )

        // nothing to confirm -> caller skipped setupTwoFactor
        if (!current.twoFactorSecret) {
            throw new TwoFactorInvalidCodeException({
                userId: user.id,
            })
        }

        // decrypt the stored secret and verify the supplied code against it
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

        // code matched -> promote the pending secret to active
        await this.entityManager.update(
            UserEntity,
            {
                id: user.id,
            },
            {
                twoFactorEnabled: true,
            },
        )

        return {
        } as ConfirmTwoFactorResponse
    }
}
