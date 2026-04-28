import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
} from "@modules/bussiness"
import {
    KeycloakJwtPayload,
    KeycloakTokenService,
} from "@modules/keycloak"
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
    JwtService 
} from "@nestjs/jwt"
import {
    InvalidJwtPayloadException, 
    UserNotFoundException
} from "@modules/exceptions"
import {
    InjectPrimaryPostgreSQLEntityManager,
    UserEntity,
} from "@modules/databases"
import {
    EntityManager 
} from "typeorm"
import {
    OtpChallengeService 
} from "@modules/code"
import { 
    EnqueueSendMailJobService 
} from "@modules/bussiness"

@CommandHandler(SignInInitCommand)
@Injectable()
export class SignInInitHandler
    extends ICQRSHandler<SignInInitCommand, SignInInitData>
    implements ICommandHandler<SignInInitCommand, SignInInitData>
{
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly keycloakTokenService: KeycloakTokenService,
        private readonly jwtService: JwtService,
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
        // Verify credentials with Keycloak; keep tokens server-side until OTP is verified.
        const tokenResponse = await this.keycloakTokenService.exchangePasswordForToken(
            {
                username: email,
                password,
            }
        )
        const decoded = this.jwtService.decode<KeycloakJwtPayload>(
            tokenResponse.access_token
        )
        if (!decoded || typeof decoded === "string" || !decoded.sub) {
            throw new InvalidJwtPayloadException(
                {
                    payload: decoded,
                }
            )
        }
        const user = await this.entityManager.findOne(
            UserEntity,
            {
                where: {
                    keycloakId: decoded.sub,
                },
            }
        )
        if (!user) {
            throw new UserNotFoundException(
                {
                    keycloakId: decoded.sub,
                }
            )
        }
        const challenge = await this.otpChallengeService.createLoginChallenge(
            {
                email,
                tokenResponse,
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

