import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    InjectPrimaryPostgreSQLEntityManager,
    UserEntity,
} from "@modules/databases"
import {
    KeycloakJwtPayload,
    KeycloakTokenService,
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
    KeycloakGithubCallbackCommand,
} from "./callback.command"
import {
    KeycloakGithubCallbackResponse,
} from "./dtos"

@CommandHandler(KeycloakGithubCallbackCommand)
@Injectable()
export class KeycloakGithubCallbackHandler
    extends ICQRSHandler<KeycloakGithubCallbackCommand, KeycloakGithubCallbackResponse>
    implements ICommandHandler<KeycloakGithubCallbackCommand, KeycloakGithubCallbackResponse> {
    constructor(
        private readonly keycloakTokenService: KeycloakTokenService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly jwtService: JwtService,
    ) {
        super()
    }

    protected override async process(
        command: KeycloakGithubCallbackCommand,
    ): Promise<KeycloakGithubCallbackResponse> {
        const {
            code,
        } = command.params

        const response = await this.keycloakTokenService.exchangeCodeForToken({
            code,
            redirectUri: envConfig().keycloak.redirectUri.github,
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
        const githubUsername = decoded.preferred_username ?? null
        if (!user) {
            user = this.entityManager.create(
                UserEntity,
                {
                    username: githubUsername ?? decoded.sub,
                    email: decoded.email,
                    keycloakId: decoded.sub,
                    githubUsername,
                },
            )
            await this.entityManager.save(user)
        } else if (!user.githubUsername && githubUsername) {
            user.githubUsername = githubUsername
            await this.entityManager.save(user)
        }
        return {
            id: user.id,
            accessToken: response.access_token,
            refreshToken: response.refresh_token,
        }
    }
}
