import {
    ApiProperty,
} from "@nestjs/swagger"
import {
    IsString,
    IsNotEmpty,
    IsInt,
    IsPositive,
} from "class-validator"

/**
 * Request body for `POST /uploads/init` — declares the file the client is about
 * to upload in chunks. The server derives `totalChunks` from `size`.
 */
export class InitUploadDto {
    /** Original filename. */
    @ApiProperty({
        description: "Original filename of the file to upload.",
    })
    @IsString()
    @IsNotEmpty()
        filename!: string

    /** Total file size in bytes. */
    @ApiProperty({
        description: "Total file size in bytes.",
    })
    @IsInt()
    @IsPositive()
        size!: number
}
