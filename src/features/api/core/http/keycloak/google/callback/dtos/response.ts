import {
    IsJWT,
    IsUUID 
} from "class-validator"

/**
 * Tokens after Google-via-Keycloak login -- same shape the SPA already stores from password
 * login.
 */
export class KeycloakGoogleCallbackResponse {
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