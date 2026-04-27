import {
    IsJWT,
    IsUUID 
} from "class-validator"

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