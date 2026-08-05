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
    KeycloakLoginCommand,
} from "./login.command"
import {
    KeycloakTokenPayloadInvalidException,
} from "@modules/platform/exceptions/errors/keycloak/keycloak-token-payload-invalid"
import {
    KeycloakTokenSubjectMissingException,
} from "@modules/platform/exceptions/errors/keycloak/keycloak-token-subject-missing"

@CommandHandler(KeycloakLoginCommand)
@Injectable()
/**
 * Exchanges password for tokens then upserts UserEntity from the JWT sub so GraphQL has a
 * local row on first login.
 */
export class KeycloakLoginHandler
    extends ICQRSHandler<KeycloakLoginCommand, KeycloakAuthResponse>
    implements ICommandHandler<KeycloakLoginCommand, KeycloakAuthResponse> {
    constructor(
        private readonly keycloakTokenService: KeycloakTokenService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly jwtService: JwtService,
    ) {
        super()
    }

    protected override async process(
        command: KeycloakLoginCommand,
    ): Promise<KeycloakAuthResponse> {
        const tokenResponse = await this.keycloakTokenService.exchangePasswordForToken({
            username: command.params.username,
            password: command.params.password,
        })

        const decoded = this.jwtService.decode<KeycloakJwtPayload>(tokenResponse.access_token)
        if (!decoded || typeof decoded === "string") {
            throw new KeycloakTokenPayloadInvalidException({
            })
        }
        if (!decoded.sub) {
            throw new KeycloakTokenSubjectMissingException({
            })
        }

        let user = await this.entityManager.findOne(
            UserEntity,
            {
                where: {
                    keycloakId: decoded.sub,
                },
            },
        )

        if (!user) {
            user = this.entityManager.create(
                UserEntity,
                {
                    username: deriveUsername({
                        email: decoded.email,
                        fallback: decoded.preferred_username ?? command.params.username,
                    }),
                    email: decoded.email ?? null,
                    keycloakId: decoded.sub,
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
