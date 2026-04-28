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

@CommandHandler(SignUpVerifyOtpCommand)
@Injectable()
export class SignUpVerifyOtpHandler
    extends ICQRSHandler<SignUpVerifyOtpCommand, SignUpVerifyOtpCommandResult>
    implements ICommandHandler<SignUpVerifyOtpCommand, SignUpVerifyOtpCommandResult>
{
    constructor(
        private readonly jwtService: JwtService,
        private readonly otpChallengeService: OtpChallengeService,
    ) {
        super()
    }

    protected override async process(
        command: SignUpVerifyOtpCommand,
    ): Promise<SignUpVerifyOtpCommandResult> {
        try {
        const {
            request: {
                challengeId,
                otp,
            },
        } = command.params

        const result = await this.otpChallengeService.verifyLoginChallenge(
            {
                challengeId,
                otp,
            }
        )

        if (!result.tokens) {
            throw new ChallengeTokensNotFoundException(
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

        const decoded = this.jwtService.decode<KeycloakJwtPayload>(
            result.tokens.accessToken
        )
        if (!decoded || typeof decoded === "string" || !decoded.sub) {
            throw new InvalidJwtPayloadException(
                {
                    payload: result.tokens.accessToken,
                }
            )
        }

        return {
            data: {
                accessToken: result.tokens.accessToken,
            },
            refreshToken: result.tokens.refreshToken,
        }
        } catch (error) {
            console.error(error)
            throw error
        }
    }
}

