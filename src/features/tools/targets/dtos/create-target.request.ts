import {
    ApiProperty,
} from "@nestjs/swagger"
import {
    IsBoolean,
    IsNotEmpty,
    IsOptional,
    IsString,
} from "class-validator"

/**
 * Request DTO for saving a new S3 target.
 */
export class CreateTargetRequest {
    @ApiProperty({
        description: "Unique human label for the target.",
        example: "do-spaces-backups",
    })
    @IsString()
    @IsNotEmpty()
        name: string

    @ApiProperty({
        description: "S3-compatible endpoint URL.",
        example: "https://sfo3.digitaloceanspaces.com",
    })
    @IsString()
    @IsNotEmpty()
        endpoint: string

    @ApiProperty({
        description: "Region the bucket lives in.",
        example: "sfo3",
    })
    @IsString()
    @IsNotEmpty()
        region: string

    @ApiProperty({
        description: "Access key id.",
    })
    @IsString()
    @IsNotEmpty()
        accessKeyId: string

    @ApiProperty({
        description: "Secret access key.",
    })
    @IsString()
    @IsNotEmpty()
        secretAccessKey: string

    @ApiProperty({
        description: "Destination bucket.",
    })
    @IsString()
    @IsNotEmpty()
        bucket: string

    @ApiProperty({
        description: "Force path-style addressing (MinIO/self-hosts need this).",
        required: false,
        default: true,
    })
    @IsOptional()
    @IsBoolean()
        forcePathStyle?: boolean
}
