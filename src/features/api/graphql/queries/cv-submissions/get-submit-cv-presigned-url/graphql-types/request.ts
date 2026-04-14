import {
    Field,
    InputType,
} from "@nestjs/graphql"

/**
 * Request payload for getting a pre-signed URL to submit a CV.
 */
@InputType({
    description: "Input for getting a CV submission pre-signed URL.",
})
export class GetSubmitCvPresignedUrlRequest {
    /**
     * Original filename (used to determine extension).
     */
    @Field(
        () => String,
        {
            description: "The original filename including extension (e.g., 'resume.pdf').",
        },
    )
        fileName: string
}
