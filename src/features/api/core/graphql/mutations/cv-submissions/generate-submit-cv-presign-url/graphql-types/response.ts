import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse, 
    IAbstractGraphQLResponse
} from "@modules/api"

@ObjectType({
    description: "Response for generating a CV submission pre-signed URL.",
})
/**
 * Response payload for getting a pre-signed URL to submit a CV.
 */
export class GenerateSubmitCvPresignUrlResponseData {
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
     * The storage object key the file is PUT to. WF-07: the client passes this
     * same key into the `uploadCv` mutation so the uploaded CV lands in the
     * unified `cv_generations` table (`source = uploaded`) and gets scored.
     */
    @Field(
        () => String,
        {
            description: "Storage object key of the uploaded file — pass to `uploadCv` to score it in the unified table.",
        },
    )
        cdnKey: string
}

@ObjectType({
    description: "Response for verifying a CV submission upload.",
})
/**
 * Response for verifying a CV submission upload.
 */
export class GenerateSubmitCvPresignUrlResponse 
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<GenerateSubmitCvPresignUrlResponseData> 
{
    @Field(
        () => GenerateSubmitCvPresignUrlResponseData,
        {
            description: "Data payload.",
        })
        data: GenerateSubmitCvPresignUrlResponseData
}   
