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
    deriveUsername,
} from "@modules/keycloak"
import {
    envConfig,
} from "@modules/env"
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
    KeycloakGoogleCallbackCommand,
} from "./callback.command"
import {
    KeycloakGoogleCallbackResponse,
} from "./dtos"

@CommandHandler(KeycloakGoogleCallbackCommand)
@Injectable()
/**
 * Exchanges the Keycloak code and upserts UserEntity from the JWT so a Google IdP login
 * creates the same local row as password register.
 */
export class KeycloakGoogleCallbackHandler
    extends ICQRSHandler<KeycloakGoogleCallbackCommand, KeycloakGoogleCallbackResponse>
    implements ICommandHandler<KeycloakGoogleCallbackCommand, KeycloakGoogleCallbackResponse> {
    constructor(
        private readonly keycloakTokenService: KeycloakTokenService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly jwtService: JwtService,
    ) {
        super()
    }

    protected override async process(
        command: KeycloakGoogleCallbackCommand,
    ): Promise<KeycloakGoogleCallbackResponse> {
        const {
            code,
        } = command.params

        const response = await this.keycloakTokenService.exchangeCodeForToken({
            code,
            redirectUri: envConfig().keycloak.redirectUri.google,
            codeVerifier: "",
        })
        const decoded = this.jwtService.decode<KeycloakJwtPayload>(response.access_token)

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
                        fallback: decoded.preferred_username,
                    }),
                    email: decoded.email,
                    keycloakId: decoded.sub,
                    authenticationType: AuthenticationType.Google,
                },
            )
            await this.entityManager.save(user)
        }
        return {
            id: user.id,
            accessToken: response.access_token,
            refreshToken: response.refresh_token,
        }
    }
}
