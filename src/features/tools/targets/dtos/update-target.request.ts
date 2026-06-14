import {
    ApiProperty,
} from "@nestjs/swagger"
import {
    IsBoolean,
    IsOptional,
    IsString,
} from "class-validator"

/**
 * Request DTO for updating an existing S3 target (all fields optional).
 */
export class UpdateTargetRequest {
    @ApiProperty({
        required: false,
    })
    @IsOptional()
    @IsString()
        name?: string

    @ApiProperty({
        required: false,
    })
    @IsOptional()
    @IsString()
        endpoint?: string

    @ApiProperty({
        required: false,
    })
    @IsOptional()
    @IsString()
        region?: string

    @ApiProperty({
        required: false,
    })
    @IsOptional()
    @IsString()
        accessKeyId?: string

    @ApiProperty({
        required: false,
    })
    @IsOptional()
    @IsString()
        secretAccessKey?: string

    @ApiProperty({
        required: false,
    })
    @IsOptional()
    @IsString()
        bucket?: string

    @ApiProperty({
        required: false,
    })
    @IsOptional()
    @IsBoolean()
        forcePathStyle?: boolean
}
