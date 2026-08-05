import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    InjectPrimaryPostgreSQLEntityManager,
    UserEntity,
    AuthenticationType,
} from "@modules/databases"
import {
    KeycloakJwtPayload,
    KeycloakTokenService,
    KeycloakUserService,
    deriveUsername,
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
    EntityManager,
} from "typeorm"
import {
    KeycloakAuthResponse,
} from "../dtos"
import {
    KeycloakRegisterCommand,
} from "./register.command"
import {
    KeycloakTokenPayloadInvalidException,
    KeycloakTokenSubjectMissingException,
} from "@modules/exceptions"

@CommandHandler(KeycloakRegisterCommand)
@Injectable()
/**
 * Creates the Keycloak user, sends verify-email, then password-grants immediately so the
 * SPA is signed in without a second round-trip.
 */
export class KeycloakRegisterHandler
    extends ICQRSHandler<KeycloakRegisterCommand, KeycloakAuthResponse>
    implements ICommandHandler<KeycloakRegisterCommand, KeycloakAuthResponse> {
    constructor(
        private readonly keycloakTokenService: KeycloakTokenService,
        private readonly keycloakUserService: KeycloakUserService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly jwtService: JwtService,
    ) {
        super()
    }

    protected override async process(
        command: KeycloakRegisterCommand,
    ): Promise<KeycloakAuthResponse> {
        const keycloakUsername = command.params.email

        const keycloakUserId = await this.keycloakTokenService.registerUserWithPassword({
            username: keycloakUsername,
            email: command.params.email,
            password: command.params.password,
            firstName: command.params.firstName,
            lastName: command.params.lastName,
        })

        await this.keycloakTokenService.sendVerifyEmail(keycloakUserId)

        const tokenResponse = await this.keycloakTokenService.exchangePasswordForToken({
            username: keycloakUsername,
            password: command.params.password,
        })

        const decoded = this.jwtService.decode<KeycloakJwtPayload>(tokenResponse.access_token)
        if (!decoded || typeof decoded === "string") {
            throw new KeycloakTokenPayloadInvalidException({
            })
        }

        const keycloakId = decoded.sub ?? keycloakUserId
        if (!keycloakId) {
            throw new KeycloakTokenSubjectMissingException({
            })
        }

        let user = await this.entityManager.findOne(
            UserEntity,
            {
                where: {
                    keycloakId,
                },
            },
        )

        if (!user) {
            user = this.entityManager.create(
                UserEntity,
                {
                    username: deriveUsername({
                        email: decoded.email ?? command.params.email,
                        fallback: decoded.preferred_username,
                    }),
                    email: decoded.email ?? command.params.email,
                    keycloakId,
                    authenticationType: AuthenticationType.Credentials,
                },
            )
            await this.entityManager.save(user)
        }

        return {
            id: user.id,
            accessToken: tokenResponse.access_token,
            refreshToken: tokenResponse.refresh_token,
            tokenType: tokenResponse.token_type,
            idToken: tokenResponse.id_token,
        }
    }
}
