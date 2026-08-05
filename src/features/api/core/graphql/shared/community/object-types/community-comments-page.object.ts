import {
    Field,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    CommunityCommentNodeObject,
} from "./community-comment-node.object"

@ObjectType({
    description: "A page of community post comments plus the total count.",
})
/** A page of community post comments plus the total count for the queried scope. */
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

@ObjectType({
    description: "Result of a community post soft-delete (affected post id).",
})
/** Result of a community post soft-delete returning the affected post id. */
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

@ObjectType({
    description: "Result of a community comment soft-delete (affected comment id).",
})
/** Result of a community comment soft-delete returning the affected comment id. */
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
