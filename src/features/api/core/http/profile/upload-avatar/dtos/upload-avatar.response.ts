import {
    ApiProperty,
} from "@nestjs/swagger"

/**
 * Response DTO for the avatar-upload endpoint.
 */
export class UploadAvatarResponseData {
    @ApiProperty({
        description: "Public URL of the uploaded avatar (also saved on the user).",
        example: "https://cdn.example.com/bucket/avatars/<userId>/<uuid>.png",
    })
        url: string
}
