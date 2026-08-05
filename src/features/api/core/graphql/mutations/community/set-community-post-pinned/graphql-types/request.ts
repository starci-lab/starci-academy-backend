import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"

@InputType({
    description: "Request to pin/unpin a community post (founder-only).",
})
/** Request to pin/unpin a community post (founder-only). */
export class SetCommunityPostPinnedRequest {
    /** Id of the post to pin or unpin. */
    @Field(
        () => ID,
        {
            description: "Id of the post to pin or unpin.",
        },
    )
        postId: string

    /** Target pinned state. */
    @Field(
        () => Boolean,
        {
            description: "Target pinned state (true = pin, false = unpin).",
        },
    )
        pinned: boolean
}
