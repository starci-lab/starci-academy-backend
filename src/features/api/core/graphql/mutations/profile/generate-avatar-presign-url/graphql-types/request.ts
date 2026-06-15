import {
    Field,
    InputType,
} from "@nestjs/graphql"

/**
 * Request payload for minting a presigned avatar-upload URL.
 */
@InputType({
    description: "Input for generating an avatar upload pre-signed URL.",
})
export class GenerateAvatarPresignUrlRequest {
    /**
     * Image MIME type to upload (drives the stored key extension + the
     * Content-Type bound into the presigned PUT URL).
     */
    @Field(
        () => String,
        {
            description: "Image MIME type to upload (e.g. 'image/png'). Must be an allowed avatar type.",
        },
    )
        contentType: string
}
