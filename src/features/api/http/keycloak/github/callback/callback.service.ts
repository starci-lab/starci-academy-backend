import {
    Injectable,
} from "@nestjs/common"
import {
    KeycloakGithubCallbackQuery,
    KeycloakGithubCallbackResponse
} from "./dtos"
import {
    KeycloakIdentityProvider,
    KeycloakJwtPayload,
    KeycloakTokenService
} from "@modules/keycloak"
import {
    InjectPrimaryPostgreSQLEntityManager,
    UserEntity
} from "@modules/databases"
import {
    EntityManager 
} from "typeorm"
import {
    JwtService 
} from "@nestjs/jwt"

/**
 * Service for handling the GitHub Keycloak callback.
 */
@Injectable()
export class KeycloakGithubCallbackService {
    constructor(
        private readonly keycloakTokenService: KeycloakTokenService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly jwtService: JwtService,
    ) {}
    /**
     * Entry: handle the GitHub Keycloak callback.
     * @param query - The query parameters.
     * @returns The result of the callback.
     */
    async execute(
        {
            code,
        }: KeycloakGithubCallbackQuery
    ): Promise<KeycloakGithubCallbackResponse> {
        try {
            const response = await this.keycloakTokenService.exchangeCodeForToken(
                {
                    code,
                    provider: KeycloakIdentityProvider.Github,
                }
            )
            const decoded = this.jwtService.decode<KeycloakJwtPayload>(response.access_token)
            let user = await this.entityManager.findOne(
                UserEntity,
                {
                    where: {
                        keycloakId: decoded.sub,
                    },
                }
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
                    }
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
        } catch (error) {
            console.error(error)
            throw error
        }
    }
}