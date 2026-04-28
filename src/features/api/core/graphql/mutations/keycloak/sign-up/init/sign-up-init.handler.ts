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
    OtpChallengeService,
} from "@modules/code"
import {
    EnqueueSendMailJobService,
} from "@modules/bussiness"
import {
    SignUpInitCommand,
} from "./sign-up-init.command"
import type {
    SignUpInitData,
} from "./graphql-types"
import type {
    SignUpActionPayload,
} from "../types"

@CommandHandler(SignUpInitCommand)
@Injectable()
export class SignUpInitHandler
    extends ICQRSHandler<SignUpInitCommand, SignUpInitData>
    implements ICommandHandler<SignUpInitCommand, SignUpInitData>
{
    constructor(
        private readonly otpChallengeService: OtpChallengeService,
        private readonly enqueueSendMailJobService: EnqueueSendMailJobService,
    ) {
        super()
    }

    protected override async process(
        command: SignUpInitCommand,
    ): Promise<SignUpInitData> {
        const {
            request: {
                email,
                password,
                username,
                firstName,
                lastName,
            },
        } = command.params

        // OTP-gated sign-up: create Keycloak user only after OTP is verified.
        // NOTE: payload is stored in Redis for a short TTL until verification.
        const challenge = await this.otpChallengeService.createActionChallenge<SignUpActionPayload>(
            {
                email,
                payload: {
                    email,
                    password,
                    username,
                    firstName,
                    lastName,
                },
            }
        )

        await this.enqueueSendMailJobService.enqueue(
            {
                to: [
                    {
                        address: email,
                    },
                ],
                subject: "Verify your email to complete sign up",
                template: "sign-up-otp",
                context: {
                    otp: challenge.otp,
                    expiresInMinutes: Math.max(
                        1,
                        Math.ceil(
                            challenge.expiresInSeconds / 60
                        )
                    ),
                },
            }
        )

        return {
            challengeId: challenge.challengeId,
            expiresInSeconds: challenge.expiresInSeconds,
        }
    }
}

