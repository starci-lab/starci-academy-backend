import {
    IsBoolean,
    IsJWT,
    IsOptional,
    IsString,
    IsUUID,
} from "class-validator"

/**
 * Tokens the SPA must persist to call GraphQL as that user; id is our UserEntity pk, not
 * the Keycloak sub alone.
 */
export class KeycloakAuthResponse {
    @IsUUID()
        id: string

    @IsJWT()
        accessToken: string

    @IsJWT()
        refreshToken: string

    @IsString()
        tokenType: string

    @IsOptional()
    @IsJWT()
        idToken?: string
}

/**
 * Reports whether the SMTP adapter swap (and optional verify-email) succeeded so the admin
 * UI can retry without guessing.
 */
export class KeycloakConfigureMailAdapterResponse {
    @IsBoolean()
        configured: boolean

    @IsString()
        message: string
}
