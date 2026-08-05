import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    KeycloakJwtPayload,
    KeycloakTokenService,
    KeycloakUserService,
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
    ForgotPasswordVerifyOtpCommand,
} from "./forgot-password-verify-otp.command"
import type {
    ForgotPasswordVerifyOtpCommandResult,
} from "./graphql-types"
import {
    ChallengeTokensNotFoundException,
    ChallengeEmailNotFoundException,
    ChallengeOtpNotFoundException,
    ChallengeOtpMismatchException,
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
import {
    EnqueueSendMailJobService,
} from "@modules/bussiness"
import {
    envConfig,
} from "@modules/env"
import {
    enqueueLearnerEmail,
} from "@modules/transactional-email"
import type {
    ForgotPasswordActionPayload,
} from "../../types"

@CommandHandler(ForgotPasswordVerifyOtpCommand)
@Injectable()
/**
 * Applies the parked password, signs the user in, and mails a change notice
 * so a hijacked mailbox cannot reset silently.
 */
export class ForgotPasswordVerifyOtpHandler
    extends ICQRSHandler<ForgotPasswordVerifyOtpCommand, ForgotPasswordVerifyOtpCommandResult>
    implements ICommandHandler<ForgotPasswordVerifyOtpCommand, ForgotPasswordVerifyOtpCommandResult>
{
    constructor(
        private readonly jwtService: JwtService,
        private readonly otpChallengeService: OtpChallengeService,
        private readonly keycloakUserService: KeycloakUserService,
        private readonly keycloakTokenService: KeycloakTokenService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly enqueueSendMailJobService: EnqueueSendMailJobService,
    ) {
        super()
    }

    protected override async process(
        command: ForgotPasswordVerifyOtpCommand,
    ): Promise<ForgotPasswordVerifyOtpCommandResult> {
        const {
            request: {
                challengeId,
                otp,
            },
        } = command.params

        const result = await this.otpChallengeService.verifyActionChallenge<ForgotPasswordActionPayload>(
            {
                challengeId,
                otp,
            },
        )
        if (result.notFound) {
            throw new ChallengeOtpNotFoundException({
                challengeId,
            })
        }
        if (result.mismatch) {
            throw new ChallengeOtpMismatchException({
                challengeId,
            })
        }
        if (!result.email) {
            throw new ChallengeEmailNotFoundException({
                challengeId,
            })
        }
        if (!result.payload) {
            throw new ChallengeTokensNotFoundException({
                challengeId,
            })
        }

        await this.keycloakUserService.resetUserPassword(
            result.payload.keycloakUserId,
            result.payload.newPassword,
        )

        const tokenResponse = await this.keycloakTokenService.exchangePasswordForToken(
            {
                username: result.payload.email,
                password: result.payload.newPassword,
            },
        )

        const decoded = this.jwtService.decode<KeycloakJwtPayload>(tokenResponse.access_token)
        if (!decoded || typeof decoded === "string" || !decoded.sub) {
            throw new InvalidJwtPayloadException({
                payload: decoded,
            })
        }

        const user = await this.entityManager.findOne(
            UserEntity,
            {
                where: {
                    keycloakId: decoded.sub,
                },
            },
        )
        if (!user) {
            throw new UserNotFoundException({
                keycloakId: decoded.sub,
            })
        }

        // security confirmation: the password was just changed
        await enqueueLearnerEmail({
            entityManager: this.entityManager,
            enqueueSendMailJobService: this.enqueueSendMailJobService,
            userId: user.id,
            template: "password-changed",
            webBaseUrl: envConfig().web.baseUrl,
            subject: {
                vi: "Mật khẩu của bạn đã được thay đổi", // vn-ok: vi-locale string emitted to clients
                en: "Your password was changed",
            },
        })

        return {
            data: {
                accessToken: tokenResponse.access_token,
            },
            refreshToken: tokenResponse.refresh_token,
        }
    }
}