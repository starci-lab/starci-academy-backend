import {
    IsNotEmpty,
    IsString,
} from "class-validator"
import {
    ApiProperty,
} from "@nestjs/swagger"

/**
 * Request DTO for getting MPEG-DASH view URLs.
 */
export class ViewPresignedUrlRequest {
    @ApiProperty({
        description: "Asset ID of the processed video.",
        example: "e08f46f6-25c9-4b7a-a4b1-53e2ca083964",
    })
    @IsString()
    @IsNotEmpty()
        assetId: string
}
