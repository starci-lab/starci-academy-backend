import {
    ApiProperty, ApiPropertyOptional,
} from "@nestjs/swagger"
import {
    IsBoolean, IsNotEmpty, IsOptional, IsString,
} from "class-validator"

/** Request body for updating a user's name. */
export class PatchUserDto {
    /** New display name. */
    @ApiProperty({
        description: "New display name.",
    })
    @IsString()
    @IsNotEmpty()
        name: string

    /** When true the server simulates a 500 error for rollback demos. */
    @ApiPropertyOptional({
        description: "Simulate server-side failure.",
    })
    @IsBoolean()
    @IsOptional()
        fail?: boolean
}
