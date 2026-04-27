import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    InjectPrimaryPostgreSQLEntityManager,
    UserEntity,
} from "@modules/databases"
import {
    KeycloakIdentityProvider,
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
            provider: KeycloakIdentityProvider.Google,
            redirectUri: "http://localhost:3000/vi",
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
                    username: decoded.preferred_username,
                    email: decoded.email,
                    keycloakId: decoded.sub,
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
