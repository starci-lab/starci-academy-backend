import {
    ApiProperty,
} from "@nestjs/swagger"
import {
    IsNotEmpty,
    IsString,
    IsUrl,
} from "class-validator"

/**
 * Request DTO for processing a video.
 */
export class ProcessVideoRequest {
    @ApiProperty({
        description: "Full S3 URL of the source video (MinIO or DigitalOcean).",
        example: "https://minio.starci.net/bucket/videos/lecture-01.mp4",
    })
    @IsString()
    @IsNotEmpty()
    @IsUrl({
        require_tld: false,
        require_protocol: true,
    })
    url: string
}
