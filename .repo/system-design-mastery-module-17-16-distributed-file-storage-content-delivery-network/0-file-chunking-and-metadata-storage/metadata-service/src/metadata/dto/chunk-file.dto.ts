import {
    IsNotEmpty,
    IsNumber,
    IsString,
    Min,
} from "class-validator"

/**
 * Payload mo phong yeu cau chia file thanh chunk.
 * (EN: Payload that simulates a file chunking request.)
 */
export class ChunkFileDto {
    @IsString()
    @IsNotEmpty()
    fileId!: string

    @IsString()
    @IsNotEmpty()
    fileName!: string

    @IsNumber()
    @Min(1)
    sizeBytes!: number

    @IsNumber()
    @Min(1)
    chunkSizeBytes!: number
}
