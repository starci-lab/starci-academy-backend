import {
    Field,
    InputType,
} from "@nestjs/graphql"

/**
 * Request payload for confirming an avatar upload after the client PUT.
 */
@InputType({
    description: "Input for verifying an avatar upload.",
})
export class VerifyAvatarPresignUrlRequest {
    /**
     * The object key returned by generateAvatarPresignUrl. Verified to belong to
     * the authenticated user before the avatar is persisted.
     */
    @Field(
        () => String,
        {
            description: "S3 object key returned by generateAvatarPresignUrl.",
        },
    )
        key: string
}
