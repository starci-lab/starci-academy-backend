import {
    ICQRSHandler,
} from "@modules/platform/cqrs/icqrs-handler"
import {
    KeycloakTokenService,
} from "@modules/integrations/keycloak/token.service"
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
} from "./graphql-types/response"
import {
    OtpChallengeService,
} from "@modules/integrations/code/otp-challenge.service"
import {
    EnqueueSendMailJobService,
} from "@modules/bussiness/jobs/enqueue/send-mail.service"
import type {
    SignInActionPayload,
} from "../types/action"

@CommandHandler(SignInInitCommand)
@Injectable()
/**
 * Verifies password with Keycloak, parks the tokens on an OTP challenge, and
 * mails the code -- login is incomplete until verify consumes that challenge.
 */
export class SignInInitHandler
    extends ICQRSHandler<SignInInitCommand, SignInInitData>
    implements ICommandHandler<SignInInitCommand, SignInInitData>
{
    constructor(
        private readonly otpChallengeService: OtpChallengeService,
        private readonly enqueueSendMailJobService: EnqueueSendMailJobService,
        private readonly keycloakTokenService: KeycloakTokenService,
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

        const tokenResponse = await this.keycloakTokenService.exchangePasswordForToken(
            {
                username: email,
                password,
            }
        )
        const challenge = await this.otpChallengeService.createActionChallenge<SignInActionPayload>(
            {
                email,
                payload: {
                    email,
                    accessToken: tokenResponse.access_token,
                    refreshToken: tokenResponse.refresh_token,
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

