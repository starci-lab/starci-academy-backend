import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

/**
 * Data payload for verifying an avatar upload.
 */
@ObjectType({
    description: "Result of verifying an avatar upload.",
})
export class VerifyAvatarPresignUrlResponseData {
    @Field(
        () => Boolean,
        {
            description: "True when the object exists in storage and the avatar was persisted.",
        },
    )
        uploaded: boolean

    @Field(
        () => String,
        {
            nullable: true,
            description: "Public URL of the persisted avatar, or null when the upload was not found.",
        },
    )
        url: string | null
}

/**
 * Envelope response for verifying an avatar upload.
 */
@ObjectType({
    description: "Response for verifying an avatar upload.",
})
export class VerifyAvatarPresignUrlResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<VerifyAvatarPresignUrlResponseData> {
    @Field(
        () => VerifyAvatarPresignUrlResponseData,
        {
            description: "Data payload.",
        })
        data: VerifyAvatarPresignUrlResponseData
}
