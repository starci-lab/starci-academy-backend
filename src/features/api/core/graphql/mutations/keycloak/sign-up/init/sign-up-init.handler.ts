import {
    ICQRSHandler,
} from "@modules/platform/cqrs/icqrs-handler"
import {
    KeycloakTokenService,
} from "@modules/integrations/keycloak/token.service"
import {
    KeycloakUserService,
} from "@modules/integrations/keycloak/user.service"
import {
    Injectable,
} from "@nestjs/common"
import {
    CommandHandler,
    ICommandHandler,
} from "@nestjs/cqrs"
import {
    OtpChallengeService,
} from "@modules/integrations/code/otp-challenge.service"
import {
    EnqueueSendMailJobService,
} from "@modules/bussiness/jobs/enqueue/send-mail.service"
import {
    SignUpInitCommand,
} from "./sign-up-init.command"
import type {
    SignUpInitData,
} from "./graphql-types/response"
import type {
    SignUpActionPayload,
} from "../types/action"
import {
    UserEmailAlreadyVerifiedException,
} from "@modules/platform/exceptions/errors/users/sign-up"

@CommandHandler(SignUpInitCommand)
@Injectable()
/**
 * Handler for the sign up init command.
 */
export class SignUpInitHandler
    extends ICQRSHandler<SignUpInitCommand, SignUpInitData>
    implements ICommandHandler<SignUpInitCommand, SignUpInitData>
{
    constructor(
        private readonly otpChallengeService: OtpChallengeService,
        private readonly enqueueSendMailJobService: EnqueueSendMailJobService,
        private readonly keycloakTokenService: KeycloakTokenService,
        private readonly keycloakUserService: KeycloakUserService,
    ) {
        super()
    }

    /**
     * Process the sign up init command.
     * @param command - The sign up init command.
     * @returns The sign up init data.
     */
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

        const keycloakUsername = username ?? email

        let keycloakUserId: string
        const user = await this.keycloakUserService.getUserByUsername(
            keycloakUsername
        )
        if (user?.emailVerified) {
            throw new UserEmailAlreadyVerifiedException(
                {
                    email,
                }
            )
        }
        if (user) {
            keycloakUserId = user.id
        } else {
            //create a new user
            keycloakUserId = await this.keycloakTokenService.registerUserWithPassword(
                {
                    username: keycloakUsername,
                    email,
                    password,
                    firstName,
                    lastName,
                }
            )
        }
        const challenge = await this.otpChallengeService.createActionChallenge<SignUpActionPayload>(
            {
                email,
                payload: {
                    keycloakUserId,
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

