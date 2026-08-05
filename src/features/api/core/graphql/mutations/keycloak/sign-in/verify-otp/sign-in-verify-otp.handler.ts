import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    KeycloakJwtPayload,
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
    ChallengeOtpNotFoundException,
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
                accessToken,
            },
            refreshToken,
        }
    }
}

