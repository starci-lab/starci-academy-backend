import {
    ApiProperty,
    ApiPropertyOptional,
} from "@nestjs/swagger"
import {
    IsNotEmpty,
    IsOptional,
    IsString,
} from "class-validator"

/**
 * Request DTO for generating presigned upload URLs.
 */
export class PresignedUrlRequest {
    @ApiProperty({
        description: "The object key (path) to upload to in S3.",
        example: "courses/images/banner.png",
    })
    @IsString()
    @IsNotEmpty()
        key: string

    @ApiPropertyOptional({
        description: "The MIME content type of the file to upload.",
        example: "image/png",
    })
    @IsString()
    @IsOptional()
        contentType?: string
}
