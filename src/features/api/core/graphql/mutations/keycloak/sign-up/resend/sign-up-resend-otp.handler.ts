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
    SignUpResendOtpCommand,
} from "./sign-up-resend-otp.command"
import type {
    SignUpInitData,
} from "../init/graphql-types/response"
import {
    ChallengeOtpNotFoundException,
} from "@modules/platform/exceptions/errors/users/otp"
import {
    OtpChallengeService,
} from "@modules/integrations/code/otp-challenge.service"
import {
    EnqueueSendMailJobService,
} from "@modules/bussiness/jobs/enqueue/send-mail.service"

@CommandHandler(SignUpResendOtpCommand)
@Injectable()
/**
 * Rotates the sign-up OTP on the existing challenge so the unverified
 * Keycloak user and parked payload stay intact.
 */
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
            throw new ChallengeOtpNotFoundException(
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
