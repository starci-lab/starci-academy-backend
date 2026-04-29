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
    ForgotPasswordInitCommand,
} from "./forgot-password-init.command"
import type {
    SignInInitData,
} from "../../init/graphql-types"
import {
    OtpChallengeService,
} from "@modules/code"
import {
    KeycloakUserService,
} from "@modules/keycloak"
import {
    EnqueueSendMailJobService,
} from "@modules/bussiness"
import {
    UserNotFoundException,
} from "@modules/exceptions"
import type {
    ForgotPasswordActionPayload,
} from "../../types"

@CommandHandler(ForgotPasswordInitCommand)
@Injectable()
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
                template: "sign-in-otp",
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