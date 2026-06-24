import {
    Field,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    CommunityCommentNodeObject,
} from "./community-comment-node.object"

/** A page of community post comments plus the total count for the queried scope. */
@ObjectType({
    description: "A page of community post comments plus the total count.",
})
export class CommunityCommentsPageObject {
    /** The page of comment nodes. */
    @Field(
        () => [CommunityCommentNodeObject],
        {
            description: "The page of comment nodes.",
        },
    )
        comments: Array<CommunityCommentNodeObject>

    /** Total comments matching the scope (for pagination). */
    @Field(
        () => Int,
        {
            description: "Total comments matching the scope (for pagination).",
        },
    )
        total: number
}

/** Result of a community post soft-delete returning the affected post id. */
@ObjectType({
    description: "Result of a community post soft-delete (affected post id).",
})
export class DeletedCommunityPostObject {
    /** Id of the soft-deleted post. */
    @Field(
        () => String,
        {
            description: "Id of the soft-deleted post.",
        },
    )
        id: string
}

/** Result of a community comment soft-delete returning the affected comment id. */
@ObjectType({
    description: "Result of a community comment soft-delete (affected comment id).",
})
export class DeletedCommunityCommentObject {
    /** Id of the soft-deleted comment. */
    @Field(
        () => String,
        {
            description: "Id of the soft-deleted comment.",
        },
    )
        id: string
}
