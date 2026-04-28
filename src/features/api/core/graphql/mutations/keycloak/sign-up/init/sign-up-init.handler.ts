import {
    ICQRSHandler,
} from "@modules/cqrs"
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
    JwtService,
} from "@nestjs/jwt"
import {
    InjectPrimaryPostgreSQLEntityManager,
    UserEntity,
} from "@modules/databases"
import type {
    EntityManager,
} from "typeorm"
import {
    InvalidJwtPayloadException,
} from "@modules/exceptions"
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

@CommandHandler(SignUpInitCommand)
@Injectable()
export class SignUpInitHandler
    extends ICQRSHandler<SignUpInitCommand, SignUpInitData>
    implements ICommandHandler<SignUpInitCommand, SignUpInitData>
{
    constructor(
        private readonly keycloakTokenService: KeycloakTokenService,
        private readonly jwtService: JwtService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
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

        const keycloakUsername = username ?? email

        const keycloakUserId = await this.keycloakTokenService.registerUserWithPassword(
            {
                username: keycloakUsername,
                email,
                password,
                firstName,
                lastName,
            }
        )

        // Obtain tokens now but return them only after OTP verification.
        const tokenResponse = await this.keycloakTokenService.exchangePasswordForToken(
            {
                username: keycloakUsername,
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

        const keycloakId = decoded.sub ?? keycloakUserId

        // Create (or reuse) application user record.
        let user = await this.entityManager.findOne(
            UserEntity,
            {
                where: {
                    keycloakId,
                },
            }
        )
        if (!user) {
            user = this.entityManager.create(
                UserEntity,
                {
                    username: decoded.preferred_username ?? keycloakUsername,
                    email: decoded.email ?? email,
                    keycloakId,
                }
            )
            await this.entityManager.save(user)
        }

        const challenge = await this.otpChallengeService.createLoginChallenge(
            {
                email,
                tokenResponse,
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

