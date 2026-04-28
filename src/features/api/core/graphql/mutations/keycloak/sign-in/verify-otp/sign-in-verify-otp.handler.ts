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
    SignInVerifyOtpCommand,
} from "./sign-in-verify-otp.command"
import type {
    SignInVerifyOtpCommandResult,
} from "./graphql-types"
import {
    ChallengeTokensNotFoundException,
    ChallengeEmailNotFoundException,
    ChallengeNotFoundException,
    ChallengeOtpMismatchException,
} from "@modules/exceptions"
import {
    InvalidJwtPayloadException,
    UserNotFoundException,
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
    SignInActionPayload,
} from "../types"

@CommandHandler(SignInVerifyOtpCommand)
@Injectable()
export class SignInVerifyOtpHandler
    extends ICQRSHandler<SignInVerifyOtpCommand, SignInVerifyOtpCommandResult>
    implements ICommandHandler<SignInVerifyOtpCommand, SignInVerifyOtpCommandResult>
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

        const tokenResponse = await this.keycloakTokenService.exchangePasswordForToken(
            {
                username: result.payload.email,
                password: result.payload.password,
            }
        )

        const decoded = this.jwtService.decode<KeycloakJwtPayload>(tokenResponse.access_token)
        if (!decoded || typeof decoded === "string" || !decoded.sub) {
            throw new InvalidJwtPayloadException(
                {
                    payload: decoded,
                }
            )
        }

        const user = await this.entityManager.findOne(
            UserEntity,
            {
                where: {
                    keycloakId: decoded.sub,
                },
            }
        )
        if (!user) {
            throw new UserNotFoundException(
                {
                    keycloakId: decoded.sub,
                }
            )
        }

        return {
            data: {
                accessToken: tokenResponse.access_token,
            },
            refreshToken: tokenResponse.refresh_token,
        }
    }
}

