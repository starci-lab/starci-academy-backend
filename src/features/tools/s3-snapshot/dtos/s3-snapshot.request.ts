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
 * Request DTO for snapshotting a remote S3 bucket to local disk.
 */
export class S3SnapshotRequest {
    @ApiProperty({
        description: "S3-compatible endpoint URL of the remote server.",
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
        description: "Access key id for the remote server.",
    })
    @IsString()
    @IsNotEmpty()
        accessKeyId: string

    @ApiProperty({
        description: "Secret access key for the remote server.",
    })
    @IsString()
    @IsNotEmpty()
        secretAccessKey: string

    @ApiProperty({
        description: "Bucket to snapshot.",
        example: "starci-academy-resources",
    })
    @IsString()
    @IsNotEmpty()
        bucket: string

    @ApiProperty({
        description: "Optional key prefix to restrict the snapshot.",
        required: false,
        example: "courses/",
    })
    @IsOptional()
    @IsString()
        prefix?: string

    @ApiProperty({
        description: "Force path-style addressing (required by MinIO/self-hosts).",
        required: false,
        default: true,
    })
    @IsOptional()
    @IsBoolean()
        forcePathStyle?: boolean
}
