import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    InjectPrimaryPostgreSQLEntityManager,
    UserEntity,
    Locale,
} from "@modules/databases"
import {
    KeycloakJwtPayload,
    KeycloakTokenService,
} from "@modules/keycloak"
import {
    OtpChallengeService,
} from "@modules/auth-otp/otp-challenge.service"
import {
    EnqueueSendMailJobService,
} from "@modules/bussiness"
import {
    Injectable,
    UnauthorizedException,
} from "@nestjs/common"
import {
    CommandHandler,
    ICommandHandler,
} from "@nestjs/cqrs"
import {
    JwtService,
} from "@nestjs/jwt"
import {
    EntityManager,
} from "typeorm"
import {
    LoginInitCommand,
} from "./login-init.command"
import type {
    LoginInitData,
} from "./graphql-types"

@CommandHandler(LoginInitCommand)
@Injectable()
export class LoginInitHandler
    extends ICQRSHandler<LoginInitCommand, LoginInitData>
    implements ICommandHandler<LoginInitCommand, LoginInitData>
{
    constructor(
        private readonly keycloakTokenService: KeycloakTokenService,
        private readonly otpChallengeService: OtpChallengeService,
        private readonly enqueueSendMailJobService: EnqueueSendMailJobService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly jwtService: JwtService,
    ) {
        super()
    }

    protected override async process(
        command: LoginInitCommand,
    ): Promise<LoginInitData> {
        const {
            input: {
                email,
                password,
            },
            locale,
        } = command.params

        const normalizedEmail = email.trim().toLowerCase()

        let tokenResponse: Awaited<ReturnType<KeycloakTokenService["exchangePasswordForToken"]>>
        try {
            // We verify credentials with Keycloak, but we keep tokens server-side until OTP is verified.
            tokenResponse = await this.keycloakTokenService.exchangePasswordForToken({
                username: normalizedEmail,
                password,
            })
        } catch {
            // Generic error to avoid user enumeration / leaking credential validity.
            throw new UnauthorizedException("Invalid credentials")
        }

        const decoded = this.jwtService.decode<KeycloakJwtPayload>(tokenResponse.access_token)
        if (!decoded || typeof decoded === "string" || !decoded.sub) {
            throw new UnauthorizedException("Invalid Keycloak access token payload")
        }

        // Ensure local user exists (mirrors REST login + guard behavior).
        let user = await this.entityManager.findOne(UserEntity,
            {
                where: {
                    keycloakId: decoded.sub,
                },
            })
        if (!user) {
            user = this.entityManager.create(UserEntity,
                {
                    username: decoded.preferred_username ?? normalizedEmail,
                    email: decoded.email ?? normalizedEmail,
                    keycloakId: decoded.sub,
                })
            await this.entityManager.save(user)
        }

        const challenge = await this.otpChallengeService.createLoginChallenge({
            email: normalizedEmail,
            tokenResponse: tokenResponse,
        })

        const expiresInMinutes = Math.max(1,
            Math.ceil(challenge.expiresInSeconds / 60))

        await this.enqueueSendMailJobService.enqueue({
            to: [
                {
                    address: normalizedEmail,
                },
            ],
            subject: locale === Locale.Vi
                ? "Mã xác thực đăng nhập"
                : "Your login verification code",
            template: "login-otp",
            context: {
                otp: challenge.otp,
                expiresInMinutes,
            },
        })

        return {
            challengeId: challenge.challengeId,
            expiresInSeconds: challenge.expiresInSeconds,
        }
    }
}

