import {
    ApiPropertyOptional,
} from "@nestjs/swagger"
import {
    IsOptional, IsString,
} from "class-validator"

/**
 * Request body for creating a user. Accepts any signup/wizard/user payload —
 * both fields are optional and the store derives the missing one.
 */
export class CreateUserDto {
    /** Display name for the new user (derived from email when omitted). */
    @ApiPropertyOptional({
        description: "Display name for the new user.",
    })
    @IsString()
    @IsOptional()
        name?: string

    /** Email for the new user (derived from name when omitted). */
    @ApiPropertyOptional({
        description: "Email for the new user.",
    })
    @IsString()
    @IsOptional()
        email?: string
}
