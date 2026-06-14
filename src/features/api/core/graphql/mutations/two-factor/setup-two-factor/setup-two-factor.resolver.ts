import {
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
    SetupTwoFactorData,
    SetupTwoFactorResponse,
} from "./graphql-types"

/**
 * Start two-factor (TOTP) enrollment for the current user.
 *
 * Generates a fresh secret, stores it encrypted as the *pending* secret, and
 * returns the base32 secret + otpauth URI so the client can render a QR. Setup
 * leaves 2FA disabled until {@link confirmTwoFactor} verifies a code, so calling
 * it again (re-enrollment) safely turns the flag off until the new secret is
 * confirmed.
 */
@Resolver()
export class SetupTwoFactorResolver {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly totpService: TotpService,
        private readonly encryptionService: EncryptionService,
    ) {}

    @UseThrottler(ThrottlerConfig.Strict)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Two-factor setup started",
        [Locale.Vi]: "Đã bắt đầu thiết lập xác thực hai lớp",
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
        // fresh random secret for this enrollment attempt
        const secret = this.totpService.generateSecret()

        // encrypt the secret at rest; store the JSON payload in the user row
        const encrypted = this.encryptionService.encrypt({
            plainText: secret,
        })

        // persist as the pending secret and force the flag off until confirmed —
        // keeps `twoFactorEnabled` consistent with a secret the user has proven
        await this.entityManager.update(
            UserEntity,
            {
                id: user.id,
            },
            {
                twoFactorSecret: JSON.stringify(encrypted),
                twoFactorEnabled: false,
            },
        )

        // label the authenticator entry with a human-friendly account name
        const accountName = user.email ?? user.username ?? user.id
        const otpauthUrl = this.totpService.generateKeyUri({
            secret,
            accountName,
        })

        // return the secret only here, at enrollment time — never via a query
        return {
            secret,
            otpauthUrl,
        }
    }
}
