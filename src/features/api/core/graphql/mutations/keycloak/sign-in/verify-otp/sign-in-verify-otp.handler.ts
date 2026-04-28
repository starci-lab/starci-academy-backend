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
    ChallengeNotFoundException,
    ChallengeOtpMismatchException,
} from "@modules/exceptions"
import {
    InvalidJwtPayloadException,
} from "@modules/exceptions"
import {
    OtpChallengeService,
} from "@modules/code"

@CommandHandler(SignInVerifyOtpCommand)
@Injectable()
export class SignInVerifyOtpHandler
    extends ICQRSHandler<SignInVerifyOtpCommand, SignInVerifyOtpCommandResult>
    implements ICommandHandler<SignInVerifyOtpCommand, SignInVerifyOtpCommandResult>
{
    constructor(
        private readonly jwtService: JwtService,
        private readonly otpChallengeService: OtpChallengeService,
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
    }
}

