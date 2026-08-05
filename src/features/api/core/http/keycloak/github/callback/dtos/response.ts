import {
    IsJWT,
    IsUUID 
} from "class-validator"

/**
 * Tokens after GitHub-via-Keycloak login -- same shape the SPA already stores from password
 * login.
 */
export class KeycloakGithubCallbackResponse {
    /**
     * The id of the user.
     */
    @IsUUID()
        id: string
    /**
     * The access token.
     */
    @IsJWT()
        accessToken: string
    /**
     * The refresh token.
     */
    @IsJWT()
        refreshToken: string
}