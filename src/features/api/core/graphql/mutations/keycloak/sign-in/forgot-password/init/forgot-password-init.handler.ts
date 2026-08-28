import {
    ICQRSHandler,
} from "@modules/platform/cqrs/icqrs-handler"
import {
    Injectable,
} from "@nestjs/common"
import {
    CommandHandler,
    ICommandHandler,
} from "@nestjs/cqrs"
import {
    ForgotPasswordInitCommand,
} from "./forgot-password-init.command"
import type {
    SignInInitData,
} from "../../init/graphql-types/response"
import {
    OtpChallengeService,
} from "@modules/integrations/code/otp-challenge.service"
import {
    KeycloakUserService,
} from "@modules/integrations/keycloak/user.service"
import {
    EnqueueSendMailJobService,
} from "@modules/bussiness/jobs/enqueue/send-mail.service"
import {
    UserNotFoundException,
} from "@modules/platform/exceptions/errors/users/user"
import type {
    ForgotPasswordActionPayload,
} from "../../types/forgot-password-action"

@CommandHandler(ForgotPasswordInitCommand)
@Injectable()
/**
 * Starts password reset by parking the new password on an OTP challenge and
 * mailing the code -- the password is not applied until verify succeeds.
 */
export class ForgotPasswordInitHandler
    extends ICQRSHandler<ForgotPasswordInitCommand, SignInInitData>
    implements ICommandHandler<ForgotPasswordInitCommand, SignInInitData>
{
    constructor(
        private readonly otpChallengeService: OtpChallengeService,
        private readonly keycloakUserService: KeycloakUserService,
        private readonly enqueueSendMailJobService: EnqueueSendMailJobService,
    ) {
        super()
    }

    protected override async process(
        command: ForgotPasswordInitCommand,
    ): Promise<SignInInitData> {
        const {
            request: {
                email,
                newPassword,
            },
        } = command.params

        const keycloakUser = await this.keycloakUserService.getUserByUsername(email)
        if (!keycloakUser) {
            throw new UserNotFoundException({
                id: email,
            })
        }

        const challenge = await this.otpChallengeService.createActionChallenge<ForgotPasswordActionPayload>(
            {
                email,
                payload: {
                    email,
                    keycloakUserId: keycloakUser.id,
                    newPassword,
                },
            },
        )

        await this.enqueueSendMailJobService.enqueue(
            {
                to: [
                    {
                        address: email,
                    },
                ],
                subject: "Reset your password",
                template: "forgot-password-otp",
                context: {
                    otp: challenge.otp,
                    expiresInMinutes: Math.max(
                        1,
                        Math.ceil(
                            challenge.expiresInSeconds / 60,
                        ),
                    ),
                },
            },
        )

        return {
            challengeId: challenge.challengeId,
            expiresInSeconds: challenge.expiresInSeconds,
        }
    }
}
