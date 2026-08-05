import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    CommunityPostNodeObject,
} from "./community-post-node.object"

@ObjectType({
    description: "A cursor-paginated page of community feed posts.",
})
/** A cursor-paginated page of the community feed. */
export class CommunityFeedPageObject {
    /** The page of post nodes (pinned-first, then newest). */
    @Field(
        () => [CommunityPostNodeObject],
        {
            description: "The page of post nodes.",
        },
    )
        items: Array<CommunityPostNodeObject>

    /** Opaque cursor for the next page; null when there is no more. */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Opaque cursor for the next page; null when no more.",
        },
    )
        nextCursor: string | null
}
