import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    KeycloakJwtPayload,
    KeycloakTokenService,
} from "@modules/keycloak"
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
} from "./graphql-types"
import {
    ChallengeTokensNotFoundException,
    ChallengeEmailNotFoundException,
    ChallengeNotFoundException,
    ChallengeOtpMismatchException,
    InvalidJwtPayloadException,
} from "@modules/exceptions"
import {
    OtpChallengeService,
} from "@modules/code"
import {
    InjectPrimaryPostgreSQLEntityManager,
    UserEntity,
} from "@modules/databases"
import type {
    EntityManager,
} from "typeorm"
import type {
    SignUpActionPayload,
} from "../types"

@CommandHandler(SignUpVerifyOtpCommand)
@Injectable()
export class SignUpVerifyOtpHandler
    extends ICQRSHandler<SignUpVerifyOtpCommand, SignUpVerifyOtpCommandResult>
    implements ICommandHandler<SignUpVerifyOtpCommand, SignUpVerifyOtpCommandResult>
{
    constructor(
        private readonly jwtService: JwtService,
        private readonly otpChallengeService: OtpChallengeService,
        private readonly keycloakTokenService: KeycloakTokenService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {
        super()
    }

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
            throw new ChallengeNotFoundException(
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

        const keycloakUserId = await this.keycloakTokenService.registerUserWithPassword(
            {
                username: keycloakUsername,
                email: result.payload.email,
                password: result.payload.password,
                firstName: result.payload.firstName,
                lastName: result.payload.lastName,
            }
        )

        await this.keycloakTokenService.sendVerifyEmail(keycloakUserId)

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
            throw new InvalidJwtPayloadException(
                {
                    payload: decoded,
                }
            )
        }

        const keycloakId = decoded.sub ?? keycloakUserId

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
                    username: decoded.preferred_username ?? keycloakUsername,
                    email: decoded.email ?? result.payload.email,
                    keycloakId,
                }
            )
            await this.entityManager.save(user)
        }

        return {
            data: {
                accessToken: tokenResponse.access_token,
            },
            refreshToken: tokenResponse.refresh_token,
        }
    }
}

