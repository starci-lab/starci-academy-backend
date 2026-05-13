import {
    AbstractGraphQLResponse, 
    IAbstractGraphQLResponse 
} from "@modules/api"
import {
    Field,
    ObjectType,
} from "@nestjs/graphql"

/**
 * Response payload for verifying a CV upload.
 */
@ObjectType({
    description: "Response for verifying a CV submission upload.",
})
export class VerifySubmitCvPresignUrlResponseData {
    /**
     * Whether the file was found in MinIO.
     */
    @Field(
        () => Boolean,
        {
            description: "Whether the uploaded CV file was found in storage.",
        },
    )
        uploaded: boolean
}


/**
 * Response for verifying a CV submission upload.
 */
@ObjectType({
    description: "Response for verifying a CV submission upload.",
})
export class VerifySubmitCvPresignUrlResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<VerifySubmitCvPresignUrlResponseData> {
        @Field(() => VerifySubmitCvPresignUrlResponseData)
            data: VerifySubmitCvPresignUrlResponseData
}
