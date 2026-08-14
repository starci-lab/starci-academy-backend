import {
    ICQRSHandler,
} from "@modules/platform/cqrs/icqrs-handler"
import {
    KeycloakTokenService,
} from "@modules/integrations/keycloak/token.service"
import {
    KeycloakJwtPayload,
} from "@modules/integrations/keycloak/types/jwt-jwks"
import {
    KeycloakUserService,
} from "@modules/integrations/keycloak/user.service"
import {
    deriveUsername,
} from "@modules/integrations/keycloak/utils/derive-username"
import {
    Injectable,
} from "@nestjs/common"
import {
    CommandHandler,
    ICommandHandler,
} from "@nestjs/cqrs"
import {
    JwtService,
} from "@nestjs/jwt"
import {
    SignUpVerifyOtpCommand,
} from "./sign-up-verify-otp.command"
import type {
    SignUpVerifyOtpCommandResult,
} from "./graphql-types/response"
import {
    KeycloakJwtInvalidPayloadException,
} from "@modules/platform/exceptions/errors/keycloak/invalid-jwt-payload"
import {
    ChallengeTokensNotFoundException,
    ChallengeEmailNotFoundException,
    ChallengeOtpNotFoundException,
    ChallengeOtpMismatchException,
} from "@modules/platform/exceptions/errors/users/otp"
import {
    OtpChallengeService,
} from "@modules/integrations/code/otp-challenge.service"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    AuthenticationType,
} from "@modules/databases/postgresql/primary/enums/authentication-type"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import type {
    EntityManager,
} from "typeorm"
import type {
    SignUpActionPayload,
} from "../types/action"
import {
    EmailBloomFilterService,
} from "@modules/bussiness/bloom-filters/email.service"
import {
    EnqueueSendMailJobService,
} from "@modules/bussiness/jobs/enqueue/send-mail.service"
import {
    envConfig,
} from "@modules/platform/env/config"

@CommandHandler(SignUpVerifyOtpCommand)
@Injectable()
/**
 * Marks the Keycloak email verified, creates the local user, and returns
 * tokens. Cookie attachment stays in the resolver (HTTP side-effect).
 */
export class SignUpVerifyOtpHandler
    extends ICQRSHandler<SignUpVerifyOtpCommand, SignUpVerifyOtpCommandResult>
    implements ICommandHandler<SignUpVerifyOtpCommand, SignUpVerifyOtpCommandResult>
{
    constructor(
        private readonly jwtService: JwtService,
        private readonly otpChallengeService: OtpChallengeService,
        private readonly keycloakTokenService: KeycloakTokenService,
        private readonly keycloakUserService: KeycloakUserService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly emailBloomFilterService: EmailBloomFilterService,
        private readonly enqueueSendMailJobService: EnqueueSendMailJobService,
    ) {
        super()
    }

    /**
     * Process the sign up verify OTP command.
     * @param command - The sign up verify OTP command.
     * @returns The sign up verify OTP command result.
     */
    protected override async process(
        command: SignUpVerifyOtpCommand,
    ): Promise<SignUpVerifyOtpCommandResult> {
        const {
            request: {
                challengeId,
                otp,
            },
        } = command.params

        const result = await this.otpChallengeService.verifyActionChallenge<SignUpActionPayload>(
            {
                challengeId,
                otp,
            }
        )

        if (result.notFound) {
            throw new ChallengeOtpNotFoundException(
                {
                    challengeId,
                }
            )
        }
        if (result.mismatch) {
            throw new ChallengeOtpMismatchException(
                {
                    challengeId,
                }
            )
        }
        if (!result.email) {
            throw new ChallengeEmailNotFoundException(
                {
                    challengeId,
                }
            )
        }
        if (!result.payload) {
            throw new ChallengeTokensNotFoundException(
                {
                    challengeId,
                }
            )
        }
        const keycloakUsername = result.payload.username ?? result.payload.email
        await this.keycloakUserService.setUserEmailVerified(
            result.payload.keycloakUserId,
        )
        const tokenResponse = await this.keycloakTokenService.exchangePasswordForToken(
            {
                username: keycloakUsername,
                password: result.payload.password,
            }
        )
        const decoded = this.jwtService.decode<KeycloakJwtPayload>(
            tokenResponse.access_token
        )
        if (!decoded || typeof decoded === "string" || !decoded.sub) {
            throw new KeycloakJwtInvalidPayloadException(
                {
                    payload: decoded,
                }
            )
        }
        const keycloakId = decoded.sub ?? result.payload.keycloakUserId
        let user = await this.entityManager.findOne(
            UserEntity,
            {
                where: {
                    keycloakId,
                },
            }
        )
        if (!user) {
            user = this.entityManager.create(
                UserEntity,
                {
                    username: deriveUsername({
                        email: decoded.email ?? result.payload.email,
                        fallback: decoded.preferred_username ?? keycloakUsername,
                    }),
                    email: decoded.email ?? result.payload.email,
                    keycloakId,
                    authenticationType: AuthenticationType.Credentials,
                }
            )
            await this.entityManager.save(user)
            await this.emailBloomFilterService.add(user.email ?? "")

            // First-time registration -> send a one-off welcome email.
            const recipient = decoded.email ?? result.payload.email
            if (recipient) {
                await this.enqueueSendMailJobService.enqueue({
                    to: [
                        {
                            address: recipient,
                        },
                    ],
                    subject: "Welcome to StarCi Academy",
                    template: "welcome",
                    context: {
                        name:
                            result.payload.firstName ??
                            decoded.preferred_username ??
                            user.username,
                        loginUrl: envConfig().web.baseUrl,
                    },
                })
            }
        }
        return {
            data: {
                accessToken: tokenResponse.access_token,
            },
            refreshToken: tokenResponse.refresh_token,
        }
    }
}

