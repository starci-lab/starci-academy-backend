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
    SignUpResendOtpCommand,
} from "./sign-up-resend-otp.command"
import type {
    SignUpInitData,
} from "../init/graphql-types"
import {
    ChallengeNotFoundException,
} from "@modules/exceptions"
import {
    OtpChallengeService,
} from "@modules/code"
import {
    EnqueueSendMailJobService,
} from "@modules/bussiness"

@CommandHandler(SignUpResendOtpCommand)
@Injectable()
export class SignUpResendOtpHandler
    extends ICQRSHandler<SignUpResendOtpCommand, SignUpInitData>
    implements ICommandHandler<SignUpResendOtpCommand, SignUpInitData>
{
    constructor(
        private readonly otpChallengeService: OtpChallengeService,
        private readonly enqueueSendMailJobService: EnqueueSendMailJobService,
    ) {
        super()
    }

    protected override async process(
        command: SignUpResendOtpCommand,
    ): Promise<SignUpInitData> {
        const {
            request: {
                challengeId,
            },
        } = command.params

        const refreshed = await this.otpChallengeService.refreshActionChallengeOtp(
            challengeId,
        )
        if (!refreshed) {
            throw new ChallengeNotFoundException(
                {
                    challengeId,
                }
            )
        }

        await this.enqueueSendMailJobService.enqueue(
            {
                to: [
                    {
                        address: refreshed.email,
                    },
                ],
                subject: "Verify your email to complete sign up",
                template: "sign-up-otp",
                context: {
                    otp: refreshed.otp,
                    expiresInMinutes: Math.max(
                        1,
                        Math.ceil(
                            refreshed.expiresInSeconds / 60
                        )
                    ),
                },
            }
        )

        return {
            challengeId,
            expiresInSeconds: refreshed.expiresInSeconds,
        }
    }
}
