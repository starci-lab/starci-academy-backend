import {
    Field,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    CommentNodeObject,
} from "./comment-node.object"

@ObjectType({
    description: "A page of comments plus the total count for the queried scope.",
})
/** A page of comments plus the total count for the queried scope. */
export class CommentsPageObject {
    /** The page of comment nodes. */
    @Field(
        () => [CommentNodeObject],
        {
            description: "The page of comment nodes.",
        },
    )
        comments: Array<CommentNodeObject>

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
    description: "Result of a soft-delete returning the affected comment id.",
})
/** Result of a soft-delete returning the affected comment id. */
export class DeletedCommentObject {
    /** Id of the soft-deleted comment. */
    @Field(
        () => String,
        {
            description: "Id of the soft-deleted comment.",
        },
    )
        id: string
}
