import {
    IsArray,
    IsNotEmpty,
    IsObject,
    IsString,
} from "class-validator"
import {
    ApiProperty,
} from "@nestjs/swagger"

/**
 * MinIO object metadata inside the event.
 */
export class MinioObjectMetadata {
    @ApiProperty({
        description: "The object key (e.g., 'cv-submissions/user-id/submission-id.pdf').",
    })
    @IsString()
    @IsNotEmpty()
        key: string
}

/**
 * MinIO S3-compatible metadata inside the event.
 */
export class MinioS3Metadata {
    @ApiProperty({
        description: "Standard S3 object metadata.",
    })
    @IsObject()
        object: MinioObjectMetadata
}

/**
 * Represents a single record in a MinIO bucket notification.
 */
export class MinioEventRecord {
    @ApiProperty({
        description: "Standard S3-compatible metadata.",
    })
    @IsObject()
        s3: MinioS3Metadata
}

/**
 * MinIO Bucket Notification Request body.
 * Usually follows the AWS S3 Event structure.
 */
export class MinioWebhookRequest {
    @ApiProperty({
        description: "Array of event records.",
        type: [MinioEventRecord],
    })
    @IsArray()
        Records: Array<MinioEventRecord>
}
