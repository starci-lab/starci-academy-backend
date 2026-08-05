import {
    ApiProperty,
} from "@nestjs/swagger"
import {
    IsString,
    IsNotEmpty,
} from "class-validator"

/**
 * Request body for `POST /presign/put` -- the client asks the server to sign a
 * short-lived PUT URL for an object it is about to upload.
 */
export class PresignPutDto {
    /** Original filename; embedded into the generated object key. */
    @ApiProperty({
        description: "Original filename of the object to upload.",
    })
    @IsString()
    @IsNotEmpty()
        filename!: string

    /** MIME type the client will PUT; replayed on the download GET. */
    @ApiProperty({
        description: "MIME type the client will PUT.",
    })
    @IsString()
    @IsNotEmpty()
        contentType!: string
}
