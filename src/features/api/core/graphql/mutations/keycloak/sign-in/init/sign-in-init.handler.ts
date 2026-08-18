import {
    ICQRSHandler,
} from "@modules/platform/cqrs/icqrs-handler"
import {
    KeycloakTokenService,
} from "@modules/integrations/keycloak/token.service"
import {
    Injectable,
} from "@nestjs/common"
import {
    CommandHandler,
    ICommandHandler,
} from "@nestjs/cqrs"
import {
    SignInInitCommand,
} from "./sign-in-init.command"
import type {
    SignInInitResponse,
} from "./graphql-types/response"
import {
    OtpChallengeService,
} from "@modules/integrations/code/otp-challenge.service"
import {
    EnqueueSendMailJobService,
} from "@modules/bussiness/jobs/enqueue/send-mail.service"
import type {
    SignInActionPayload,
} from "../types/action"
import {
    EncryptionService,
} from "@modules/crypto/encryption.service"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    TotpService,
} from "@modules/integrations/totp/totp.service"
import {
    TwoFactorInvalidCodeException,
} from "@modules/platform/exceptions/errors/api/two-factor-invalid-code"
import type {
    EntityManager,
} from "typeorm"
import {
    envConfig,
} from "@modules/platform/env/config"
import {
    JwtService,
} from "@nestjs/jwt"
import type {
    KeycloakJwtPayload,
} from "@modules/integrations/keycloak/types/jwt-jwks"
import {
    KeycloakJwtInvalidPayloadException,
} from "@modules/platform/exceptions/errors/keycloak/invalid-jwt-payload"
import {
    AuthenticationType,
} from "@modules/databases/postgresql/primary/enums/authentication-type"
import {
    deriveUsername,
} from "@modules/integrations/keycloak/utils/derive-username"
import {
    EmailBloomFilterService,
} from "@modules/bussiness/bloom-filters/email.service"

@CommandHandler(SignInInitCommand)
@Injectable()
/**
 * Verifies password with Keycloak, parks the tokens on an OTP challenge, and
 * mails the code -- login is incomplete until verify consumes that challenge.
 */
export class SignInInitHandler
    extends ICQRSHandler<SignInInitCommand, SignInInitResponse>
    implements ICommandHandler<SignInInitCommand, SignInInitResponse>
{
    constructor(
        private readonly jwtService: JwtService,
        private readonly otpChallengeService: OtpChallengeService,
        private readonly enqueueSendMailJobService: EnqueueSendMailJobService,
        private readonly keycloakTokenService: KeycloakTokenService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly encryptionService: EncryptionService,
        private readonly totpService: TotpService,
        private readonly emailBloomFilterService: EmailBloomFilterService,
    ) {
        super()
    }

    /**
     * Process the sign in init command.
     * @param command - The sign in init command.
     * @returns The sign in init data.
     */
    protected override async process(
        command: SignInInitCommand,
    ): Promise<SignInInitResponse> {
        const {
            request: {
                email,
                password,
                twoFactorCode,
            },
        } = command.params

        const tokenResponse = await this.keycloakTokenService.exchangePasswordForToken(
            {
                username: email,
                password,
            }
        )

        // Password proof runs first to avoid disclosing whether an email has 2FA.
        // For an enrolled local user, authenticator proof is required before an
        // email challenge is created, so a failed TOTP never consumes a good OTP.
        const user = await this.entityManager.findOne(
            UserEntity,
            {
                where: {
                    email,
                },
            },
        )
        if (user?.twoFactorEnabled) {
            if (!user.twoFactorSecret || !twoFactorCode) {
                throw new TwoFactorInvalidCodeException({
                    userId: user.id,
                })
            }
            const secret = this.encryptionService.decrypt({
                payload: JSON.parse(user.twoFactorSecret),
            })
            if (!this.totpService.verify({
                secret,
                token: twoFactorCode,
            })) {
                throw new TwoFactorInvalidCodeException({
                    userId: user.id,
                })
            }
        }
        const localTestAuth = envConfig().keycloak.localTestAuth
        if (
            localTestAuth.enabled
            && email.trim().toLowerCase() === localTestAuth.email.trim().toLowerCase()
        ) {
            const decoded = this.jwtService.decode<KeycloakJwtPayload>(tokenResponse.access_token)
            if (!decoded || typeof decoded === "string" || !decoded.sub) {
                throw new KeycloakJwtInvalidPayloadException({
                    payload: decoded,
                })
            }
            let localUser = await this.entityManager.findOne(
                UserEntity,
                {
                    where: {
                        keycloakId: decoded.sub,
                    },
                },
            )
            if (!localUser) {
                localUser = this.entityManager.create(
                    UserEntity,
                    {
                        keycloakId: decoded.sub,
                        email: decoded.email ?? email,
                        username: deriveUsername({
                            email: decoded.email ?? email,
                            fallback: decoded.preferred_username,
                        }),
                        authenticationType: AuthenticationType.Credentials,
                    },
                )
                await this.entityManager.save(localUser)
                await this.emailBloomFilterService.add(localUser.email ?? "")
            }
            return {
                kind: "session",
                data: {
                    accessToken: tokenResponse.access_token,
                },
                refreshToken: tokenResponse.refresh_token,
            }
        }
        const challenge = await this.otpChallengeService.createActionChallenge<SignInActionPayload>(
            {
                email,
                payload: {
                    email,
                    accessToken: tokenResponse.access_token,
                    refreshToken: tokenResponse.refresh_token,
                },
            }
        )
        // Enqueue send mail job.
        await this.enqueueSendMailJobService.enqueue(
            {
                to: [
                    {
                        address: email,
                    },
                ],
                subject: "Sign in to your account",
                template: "sign-in-otp",
                context: {
                    otp: challenge.otp,
                    expiresInMinutes: Math.max(
                        1,
                        Math.ceil(
                            challenge.expiresInSeconds / 60
                        )
                    ),
                },
            }
        )
        return {
            kind: "challenge",
            data: {
                challengeId: challenge.challengeId,
                expiresInSeconds: challenge.expiresInSeconds,
            },
        }
    }
}

