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
} from "@modules/api"
import {
    UseThrottler,
    ThrottlerConfig,
} from "@modules/throttler"
import {
    InjectPrimaryPostgreSQLEntityManager,
    Locale,
    UserEntity,
} from "@modules/databases"
import {
    KeycloakAuthGraphQLGuard,
    KeycloakGraphQLUser,
} from "@modules/keycloak"
import {
    EncryptionService,
} from "@modules/crypto"
import {
    TotpService,
} from "@modules/totp"
import {
    TwoFactorInvalidCodeException,
} from "@modules/exceptions"
import {
    ConfirmTwoFactorRequest,
    ConfirmTwoFactorResponse,
} from "./graphql-types"

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

        // nothing to confirm → caller skipped setupTwoFactor
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

        // code matched → promote the pending secret to active
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
