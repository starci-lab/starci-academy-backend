import {
    Field,
    InputType,
} from "@nestjs/graphql"

/**
 * Request payload for getting a pre-signed URL to submit a CV.
 */
@InputType({
    description: "Input for generating a CV submission pre-signed URL.",
})
export class GenerateSubmitCvPresignUrlRequest {
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

    /**
     * Optional; can be supplied later when grading is triggered.
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "ID of the template CV to use for grading (omit at upload if not chosen yet).",
        },
    )
        templateCvId?: string
}
