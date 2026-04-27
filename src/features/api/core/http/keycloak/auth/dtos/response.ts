import {
    IsBoolean,
    IsJWT,
    IsOptional,
    IsString,
    IsUUID,
} from "class-validator"

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

export class KeycloakConfigureMailAdapterResponse {
    @IsBoolean()
        configured: boolean

    @IsString()
        message: string
}
