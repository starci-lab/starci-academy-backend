import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    InjectPrimaryPostgreSQLEntityManager,
    UserEntity,
} from "@modules/databases"
import {
    KeycloakJwtPayload,
} from "@modules/keycloak"
import {
    OtpChallengeService,
} from "@modules/auth-otp/otp-challenge.service"
import {
    SignInOtpMismatchException,
    SignInOtpNotFoundException,
} from "@modules/exceptions"
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
    EntityManager,
} from "typeorm"
import {
    LoginVerifyOtpCommand,
} from "./login-verify-otp.command"
import type {
    LoginVerifyOtpData,
} from "./graphql-types"

@CommandHandler(LoginVerifyOtpCommand)
@Injectable()
export class LoginVerifyOtpHandler
    extends ICQRSHandler<LoginVerifyOtpCommand, LoginVerifyOtpData>
    implements ICommandHandler<LoginVerifyOtpCommand, LoginVerifyOtpData>
{
    constructor(
        private readonly otpChallengeService: OtpChallengeService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly jwtService: JwtService,
    ) {
        super()
    }

    protected override async process(
        command: LoginVerifyOtpCommand,
    ): Promise<LoginVerifyOtpData> {
        const {
            input: {
                challengeId,
                otp,
            },
        } = command.params

        const result = await this.otpChallengeService.verifyLoginChallenge({
            challengeId,
            otp,
        })

        if (result.notFound) {
            throw new SignInOtpNotFoundException({
                email: "unknown",
            })
        }

        if (result.mismatch) {
            throw new SignInOtpMismatchException({
                email: result.email,
            })
        }

        const decoded = this.jwtService.decode<KeycloakJwtPayload>(result.tokens.accessToken)
        if (!decoded || typeof decoded === "string" || !decoded.sub) {
            throw new SignInOtpNotFoundException({
                email: result.email,
                originalError: new Error("Invalid stored token payload"),
            })
        }

        let user = await this.entityManager.findOne(UserEntity,
            {
                where: {
                    keycloakId: decoded.sub,
                },
            })
        if (!user) {
            user = this.entityManager.create(UserEntity,
                {
                    username: decoded.preferred_username ?? result.email,
                    email: decoded.email ?? result.email,
                    keycloakId: decoded.sub,
                })
            await this.entityManager.save(user)
        }

        return {
            id: user.id,
            accessToken: result.tokens.accessToken,
            refreshToken: result.tokens.refreshToken,
            tokenType: result.tokens.tokenType,
            idToken: result.tokens.idToken,
        }
    }
}

