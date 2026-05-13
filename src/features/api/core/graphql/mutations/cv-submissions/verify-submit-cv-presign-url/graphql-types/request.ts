import {
    Field,
    InputType,
} from "@nestjs/graphql"

/**
 * Request payload for verifying a CV upload via pre-signed URL.
 */
@InputType({
    description: "Input for verifying a CV submission upload.",
})
export class VerifySubmitCvPresignUrlRequest {
    /**
     * The CV submission ID returned by GenerateSubmitCvPresignUrl.
     */
    @Field(
        () => String,
        {
            description: "The CV submission ID to verify.",
        },
    )
        cvSubmissionId: string
}
