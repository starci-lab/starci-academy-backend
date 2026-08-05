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
    ForgotPasswordResendOtpCommand,
} from "./forgot-password-resend-otp.command"
import type {
    SignInInitData,
} from "../../init/graphql-types/response"
import {
    ChallengeOtpNotFoundException,
} from "@modules/platform/exceptions/errors/users/otp"
import {
    OtpChallengeService,
} from "@modules/integrations/code/otp-challenge.service"
import {
    EnqueueSendMailJobService,
} from "@modules/bussiness/jobs/enqueue/send-mail.service"

@CommandHandler(ForgotPasswordResendOtpCommand)
@Injectable()
/**
 * Rotates the reset OTP on the existing challenge so the parked new-password
 * payload stays intact -- a resend must not force the user to re-enter it.
 */
export class ForgotPasswordResendOtpHandler
    extends ICQRSHandler<ForgotPasswordResendOtpCommand, SignInInitData>
    implements ICommandHandler<ForgotPasswordResendOtpCommand, SignInInitData>
{
    constructor(
        private readonly otpChallengeService: OtpChallengeService,
        private readonly enqueueSendMailJobService: EnqueueSendMailJobService,
    ) {
        super()
    }

    protected override async process(
        command: ForgotPasswordResendOtpCommand,
    ): Promise<SignInInitData> {
        const {
            request: {
                challengeId,
            },
        } = command.params

        const refreshed = await this.otpChallengeService.refreshActionChallengeOtp(
            challengeId,
        )
        if (!refreshed) {
            throw new ChallengeOtpNotFoundException({
                challengeId,
            })
        }

        await this.enqueueSendMailJobService.enqueue(
            {
                to: [
                    {
                        address: refreshed.email,
                    },
                ],
                subject: "Reset your password",
                template: "forgot-password-otp",
                context: {
                    otp: refreshed.otp,
                    expiresInMinutes: Math.max(
                        1,
                        Math.ceil(
                            refreshed.expiresInSeconds / 60,
                        ),
                    ),
                },
            },
        )

        return {
            challengeId,
            expiresInSeconds: refreshed.expiresInSeconds,
        }
    }
}