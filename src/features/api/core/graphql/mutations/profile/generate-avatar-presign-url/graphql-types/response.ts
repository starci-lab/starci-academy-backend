import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

/**
 * Data payload for minting a presigned avatar-upload URL.
 */
@ObjectType({
    description: "Result of generating an avatar upload pre-signed URL.",
})
export class GenerateAvatarPresignUrlResponseData {
    @Field(
        () => String,
        {
            description: "Pre-signed PUT URL — upload the image directly to this (same Content-Type).",
        },
    )
        url: string

    @Field(
        () => String,
        {
            description: "S3 object key the upload lands on; pass back to verifyAvatarPresignUrl.",
        },
    )
        key: string
}

/**
 * Envelope response for generating an avatar upload pre-signed URL.
 */
@ObjectType({
    description: "Response for generating an avatar upload pre-signed URL.",
})
export class GenerateAvatarPresignUrlResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<GenerateAvatarPresignUrlResponseData> {
    @Field(
        () => GenerateAvatarPresignUrlResponseData,
        {
            description: "Data payload.",
        })
        data: GenerateAvatarPresignUrlResponseData
}
