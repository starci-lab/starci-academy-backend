import {
    ICQRSHandler,
} from "@modules/cqrs"
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
} from "../../init/graphql-types"
import {
    ChallengeOtpNotFoundException,
} from "@modules/exceptions"
import {
    OtpChallengeService,
} from "@modules/code"
import {
    EnqueueSendMailJobService,
} from "@modules/bussiness"

@CommandHandler(ForgotPasswordResendOtpCommand)
@Injectable()
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