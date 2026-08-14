import {
    ICQRSHandler,
} from "@modules/platform/cqrs/icqrs-handler"
import {
    KeycloakJwtPayload,
} from "@modules/integrations/keycloak/types/jwt-jwks"
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
    SignInVerifyOtpCommand,
} from "./sign-in-verify-otp.command"
import type {
    SignInVerifyOtpCommandResult,
} from "./graphql-types/response"
import {
    ChallengeTokensNotFoundException,
    ChallengeEmailNotFoundException,
    ChallengeOtpNotFoundException,
    ChallengeOtpMismatchException,
} from "@modules/platform/exceptions/errors/users/otp"
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
import {
    OtpChallengeService,
} from "@modules/integrations/code/otp-challenge.service"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import type {
    EntityManager,
} from "typeorm"
import type {
    SignInActionPayload,
} from "../types/action"

@CommandHandler(SignInVerifyOtpCommand)
@Injectable()
/**
 * Consumes the OTP challenge and returns the parked Keycloak tokens. Cookie
 * attachment stays in the resolver because CQRS must not touch HTTP.
 */
export class SignInVerifyOtpHandler
    extends ICQRSHandler<SignInVerifyOtpCommand, SignInVerifyOtpCommandResult>
    implements ICommandHandler<SignInVerifyOtpCommand, SignInVerifyOtpCommandResult>
{
    constructor(
        private readonly jwtService: JwtService,
        private readonly otpChallengeService: OtpChallengeService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly emailBloomFilterService: EmailBloomFilterService,
    ) {
        super()
    }

    /**
     * Process the sign in verify OTP command.
     * @param command - The sign in verify OTP command.
     * @returns The sign in verify OTP command result.
     */
    protected override async process(
        command: SignInVerifyOtpCommand,
    ): Promise<SignInVerifyOtpCommandResult> {
        const {
            request: {
                challengeId,
                otp,
            },
        } = command.params
        const result = await this.otpChallengeService.verifyActionChallenge<SignInActionPayload>(
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

        const {
            accessToken,
            refreshToken,
        } = result.payload

        const decoded = this.jwtService.decode<KeycloakJwtPayload>(accessToken)
        if (!decoded || typeof decoded === "string" || !decoded.sub) {
            throw new KeycloakJwtInvalidPayloadException(
                {
                    payload: decoded,
                }
            )
        }

        let user = await this.entityManager.findOne(
            UserEntity,
            {
                where: {
                    keycloakId: decoded.sub,
                },
            }
        )
        if (!user) {
            user = this.entityManager.create(
                UserEntity,
                {
                    keycloakId: decoded.sub,
                    email: decoded.email ?? result.email,
                    username: deriveUsername({
                        email: decoded.email ?? result.email,
                        fallback: decoded.preferred_username,
                    }),
                    authenticationType: AuthenticationType.Credentials,
                },
            )
            await this.entityManager.save(user)
            await this.emailBloomFilterService.add(user.email ?? "")
        }

        return {
            data: {
                accessToken,
            },
            refreshToken,
        }
    }
}

