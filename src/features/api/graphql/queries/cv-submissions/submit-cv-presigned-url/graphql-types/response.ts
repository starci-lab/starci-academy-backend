import {
    Field,
    ObjectType,
} from "@nestjs/graphql"

/**
 * Response payload for getting a pre-signed URL to submit a CV.
 */
@ObjectType({
    description: "Response for getting a CV submission pre-signed URL.",
})
export class SubmitCvPresignedUrlResponse {
    /**
     * The pre-signed PUT URL.
     */
    @Field(
        () => String,
        {
            description: "The pre-signed URL to use for uploading the CV file via PUT.",
        },
    )
        url: string

    /**
     * The ID of the created CV submission record.
     */
    @Field(
        () => String,
        {
            description: "The ID of the pending CV submission record.",
        },
    )
        cvSubmissionId: string
}
