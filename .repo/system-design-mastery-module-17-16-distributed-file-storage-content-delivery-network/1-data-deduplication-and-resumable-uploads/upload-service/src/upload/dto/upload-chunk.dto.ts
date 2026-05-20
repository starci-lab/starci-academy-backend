import {
    IsNotEmpty,
    IsNumber,
    IsString,
    Min,
} from "class-validator"

/**
 * Payload ghi nhan mot chunk upload.
 * (EN: Payload that records one uploaded chunk.)
 */
export class UploadChunkDto {
    @IsString()
    @IsNotEmpty()
    uploadId!: string

    @IsString()
    @IsNotEmpty()
    checksum!: string

    @IsNumber()
    @Min(0)
    offsetBytes!: number

    @IsNumber()
    @Min(1)
    sizeBytes!: number
}
