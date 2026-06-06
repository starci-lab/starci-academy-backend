import {
    ApiProperty,
} from "@nestjs/swagger"
import {
    IsString, IsNotEmpty, MinLength, MaxLength,
} from "class-validator"

/** Body for `POST auth/register` and `POST auth/login`. */
export class CredentialsDto {
    /** Account username (unique key in the in-memory user store). */
    @ApiProperty({
        description: "Account username.",
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(40)
        username: string

    /** Account password (kept in memory only, never persisted). */
    @ApiProperty({
        description: "Account password.",
    })
    @IsString()
    @MinLength(6)
    @MaxLength(72)
        password: string
}
