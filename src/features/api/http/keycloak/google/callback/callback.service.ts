import {
    Injectable,
} from "@nestjs/common"
import {
    KeycloakGoogleCallbackQuery, 
    KeycloakGoogleCallbackResponse
} from "./dtos"
import {
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
 * Service for handling the Google Keycloak callback.
 */
@Injectable()
export class KeycloakGoogleCallbackService {
    constructor(
        private readonly keycloakTokenService: KeycloakTokenService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly jwtService: JwtService,
    ) {}
    /**
     * Entry: handle the Google Keycloak callback.
     * @param query - The query parameters.
     * @returns The result of the callback.
     */
    async execute(
        {
            code
        }: KeycloakGoogleCallbackQuery
    ): Promise<KeycloakGoogleCallbackResponse> {
        try {
        // exchange the code for a token
            const response = await this.keycloakTokenService.exchangeCodeForToken(
                {
                    code,
                }
            )
            const decoded = this.jwtService.decode<KeycloakJwtPayload>(response.access_token)
            // find the user by the keycloak id
            let user = await this.entityManager.findOne(
                UserEntity,
                {
                    where: {
                        keycloakId: decoded.sub,
                    },
                }
            )
            // if user not found, create a new user
            if (!user) {
                user = this.entityManager.create(
                    UserEntity, 
                    {
                        username: decoded.preferred_username,
                        email: decoded.email,
                        keycloakId: decoded.sub,
                    }
                )
                await this.entityManager.save(user)
            }
            // return the tokens
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