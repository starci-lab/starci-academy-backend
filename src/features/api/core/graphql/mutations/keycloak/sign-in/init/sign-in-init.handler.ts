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
    SignInInitCommand,
} from "./sign-in-init.command"
import type {
    SignInInitData,
} from "./graphql-types"
import {
    OtpChallengeService 
} from "@modules/code"
import { 
    EnqueueSendMailJobService 
} from "@modules/bussiness"
import type {
    SignInActionPayload,
} from "../types"

@CommandHandler(SignInInitCommand)
@Injectable()
export class SignInInitHandler
    extends ICQRSHandler<SignInInitCommand, SignInInitData>
    implements ICommandHandler<SignInInitCommand, SignInInitData>
{
    constructor(
        private readonly otpChallengeService: OtpChallengeService,
        private readonly enqueueSendMailJobService: EnqueueSendMailJobService,
    ) {
        super()
    }

    /**
     * Process the sign in init command.
     * @param command - The sign in init command.
     * @returns The sign in init data.
     */
    protected override async process(
        command: SignInInitCommand,
    ): Promise<SignInInitData> {
        const {
            request: {
                email,
                password,
            },
        } = command.params

        // OTP-gated sign-in: do not hit Keycloak until OTP is verified.
        const challenge = await this.otpChallengeService.createActionChallenge<SignInActionPayload>(
            {
                email,
                payload: {
                    email,
                    password,
                },
            }
        )
        // Enqueue send mail job.
        await this.enqueueSendMailJobService.enqueue(
            {
                to: [
                    {
                        address: email,
                    },
                ],
                subject: "Sign in to your account",
                template: "sign-in-otp",
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

