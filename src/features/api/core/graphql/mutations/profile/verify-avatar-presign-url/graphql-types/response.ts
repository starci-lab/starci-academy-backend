import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
} from "@modules/api/apollo/server/graphql-types/object-types/graphql-response"
import {
    IAbstractGraphQLResponse,
} from "@modules/api/apollo/server/types/graphql-response"

@ObjectType({
    description: "Result of verifying an avatar upload.",
})
/**
 * Data payload for verifying an avatar upload.
 */
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

@ObjectType({
    description: "Response for verifying an avatar upload.",
})
/**
 * Envelope response for verifying an avatar upload.
 */
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
