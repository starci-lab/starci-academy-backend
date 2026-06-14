import {
    ApiProperty,
} from "@nestjs/swagger"
import {
    IsArray,
    IsNotEmpty,
    IsOptional,
    IsString,
} from "class-validator"

/**
 * Request DTO for backing up one database to a local disk and optionally cloud.
 */
export class PgBackupRequest {
    @ApiProperty({
        description: "Full PostgreSQL connection URL of the database to back up.",
        example: "postgres://user:pass@db.example.com:5432/app",
    })
    @IsString()
    @IsNotEmpty()
        postgresUrl: string

    @ApiProperty({
        description: "Local disk directory to write the encrypted artifact into.",
        example: "E:/backups",
    })
    @IsString()
    @IsNotEmpty()
        diskPath: string

    @ApiProperty({
        description: "Base name for the temp artifacts and the artifact subfolder.",
        example: "app-prod",
    })
    @IsString()
    @IsNotEmpty()
        artifactBaseName: string

    @ApiProperty({
        description: "Saved S3 target ids to sync to (empty/omit to keep local-only).",
        required: false,
        type: [String],
    })
    @IsOptional()
    @IsArray()
    @IsString({
        each: true,
    })
        targetIds?: Array<string>

    @ApiProperty({
        description: "Object-storage key prefix for the artifact.",
        required: false,
        example: "backups/app",
    })
    @IsOptional()
    @IsString()
        keyPrefix?: string
}
