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
    SignInResendOtpCommand,
} from "./sign-in-resend-otp.command"
import type {
    SignInInitData,
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

@CommandHandler(SignInResendOtpCommand)
@Injectable()
/**
 * Rotates the sign-in OTP on the existing challenge so parked Keycloak tokens
 * remain valid -- a resend must not force another password round-trip.
 */
export class SignInResendOtpHandler
    extends ICQRSHandler<SignInResendOtpCommand, SignInInitData>
    implements ICommandHandler<SignInResendOtpCommand, SignInInitData>
{
    constructor(
        private readonly otpChallengeService: OtpChallengeService,
        private readonly enqueueSendMailJobService: EnqueueSendMailJobService,
    ) {
        super()
    }

    protected override async process(
        command: SignInResendOtpCommand,
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
                subject: "Sign in to your account",
                template: "sign-in-otp",
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
