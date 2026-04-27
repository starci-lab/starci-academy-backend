import {
    IsString,
    MaxLength,
    MinLength,
} from "class-validator"

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
