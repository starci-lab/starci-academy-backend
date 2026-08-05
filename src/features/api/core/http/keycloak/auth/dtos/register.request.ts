import {
    IsEmail,
    IsOptional,
    IsString,
    MaxLength,
    MinLength,
} from "class-validator"

/**
 * Registration fields validated here before Keycloak user-create -- email is required
 * because username may be derived from it.
 */
export class KeycloakRegisterRequest {
    @IsOptional()
    @IsString()
    @MinLength(3)
    @MaxLength(100)
        username?: string

    @IsEmail()
    @MaxLength(255)
        email!: string

    @IsString()
    @MinLength(6)
    @MaxLength(100)
        password!: string

    @IsOptional()
    @IsString()
    @MaxLength(100)
        firstName?: string

    @IsOptional()
    @IsString()
    @MaxLength(100)
        lastName?: string
}
