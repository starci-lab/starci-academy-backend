import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse, 
    IAbstractGraphQLResponse
} from "@modules/api"

/**
 * Response payload for getting a pre-signed URL to submit a CV.
 */
@ObjectType({
    description: "Response for generating a CV submission pre-signed URL.",
})
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

    @Field(
        () => String,
        {
            description: "ID of the created CV submission attempt.",
        },
    )
        cvSubmissionId: string
}

/**
 * Response for verifying a CV submission upload.
 */
@ObjectType({
    description: "Response for verifying a CV submission upload.",
})
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
