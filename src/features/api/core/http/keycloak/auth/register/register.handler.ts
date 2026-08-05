import {
    ICQRSHandler,
} from "@modules/platform/cqrs/icqrs-handler"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    AuthenticationType,
} from "@modules/databases/postgresql/primary/enums/authentication-type"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    KeycloakTokenService,
} from "@modules/integrations/keycloak/token.service"
import {
    KeycloakJwtPayload,
} from "@modules/integrations/keycloak/types/jwt-jwks"
import {
    KeycloakUserService,
} from "@modules/integrations/keycloak/user.service"
import {
    deriveUsername,
} from "@modules/integrations/keycloak/utils/derive-username"
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
} from "../dtos/response"
import {
    KeycloakRegisterCommand,
} from "./register.command"
import {
    KeycloakTokenPayloadInvalidException,
} from "@modules/platform/exceptions/errors/keycloak/keycloak-token-payload-invalid"
import {
    KeycloakTokenSubjectMissingException,
} from "@modules/platform/exceptions/errors/keycloak/keycloak-token-subject-missing"

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
