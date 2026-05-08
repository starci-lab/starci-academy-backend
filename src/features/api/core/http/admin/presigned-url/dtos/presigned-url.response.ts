import {
    ApiProperty,
} from "@nestjs/swagger"
import {
    S3Provider,
} from "@modules/s3"

/**
 * Single presigned URL item in the response.
 */
export class PresignedUrlItemResponse {
    @ApiProperty({
        description: "The S3 provider name.",
        enum: S3Provider,
        example: S3Provider.Minio,
    })
        provider: S3Provider

    @ApiProperty({
        description: "The presigned upload URL.",
        example: "https://minio.example.com/bucket/key?X-Amz-Signature=...",
    })
        url: string
}

/**
 * Response DTO for the presigned URL endpoint.
 */
export class PresignedUrlResponseData {
    @ApiProperty({
        description: "Array of presigned URLs, one per S3 provider.",
        type: [PresignedUrlItemResponse],
    })
        data: Array<PresignedUrlItemResponse>
}
