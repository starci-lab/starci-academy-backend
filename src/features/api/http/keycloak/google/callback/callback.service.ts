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
    InjectPrimaryPostgresqlEntityManager, 
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
        @InjectPrimaryPostgresqlEntityManager()
        private readonly entityManager: EntityManager,
        private readonly jwtService: JwtService,
    ) {}
    /**
     * Handle the Google Keycloak callback.
     * @param query - The query parameters.
     * @returns The result of the callback.
     */
    async callback(
        {
            code
        }: KeycloakGoogleCallbackQuery
    ): Promise<KeycloakGoogleCallbackResponse> {
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
    }
}