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
    UserNotFoundException,
} from "@modules/platform/exceptions/errors/users/user"
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
import {
    EnqueueSendMailJobService,
} from "@modules/bussiness/jobs/enqueue/send-mail.service"
import {
    envConfig,
} from "@modules/platform/env/config"
import {
    enqueueLearnerEmail,
} from "@modules/integrations/transactional-email/enqueue-learner-email"
import type {
    ForgotPasswordActionPayload,
} from "../../types/forgot-password-action"

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
            throw new KeycloakJwtInvalidPayloadException({
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