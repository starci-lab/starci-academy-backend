import {
    IsString,
    MaxLength,
    MinLength,
} from "class-validator"

/**
 * Username/password validated at the REST boundary so a malformed grant never reaches the
 * Keycloak token endpoint.
 */
export class KeycloakLoginRequest {
    @IsString()
    @MinLength(3)
    @MaxLength(100)
        username: string

    @IsString()
    @MinLength(6)
    @MaxLength(100)
        password: string
}
