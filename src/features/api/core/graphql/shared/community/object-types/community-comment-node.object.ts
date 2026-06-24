import {
    Field,
    ID,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    UserEntity,
} from "@modules/databases"
import {
    ReactionSummaryObject,
} from "../../discussion"

/** A single threaded community post comment shaped for the client. */
@ObjectType({
    description: "A threaded community post comment with author, reply count and reactions.",
})
export class CommunityCommentNodeObject {
    /** Comment primary id. */
    @Field(
        () => ID,
        {
            description: "Comment primary id.",
        },
    )
        id: string

    /** Comment body (already a placeholder when soft-deleted, see `isDeleted`). */
    @Field(
        () => String,
        {
            description: "Comment body authored by the user.",
        },
    )
        body: string

    /** Whether the comment was soft-deleted by its author. */
    @Field(
        () => Boolean,
        {
            description: "Whether the comment was soft-deleted by its author.",
        },
    )
        isDeleted: boolean

    /** Timestamp of the last edit (null if never edited). */
    @Field(
        () => Date,
        {
            nullable: true,
            description: "Timestamp of the last edit (null if never edited).",
        },
    )
        editedAt: Date | null

    /** Row creation timestamp. */
    @Field(
        () => Date,
        {
            description: "Row creation timestamp.",
        },
    )
        createdAt: Date

    /** Parent comment id (null for top-level comments). */
    @Field(
        () => ID,
        {
            nullable: true,
            description: "Parent comment id (null for top-level comments).",
        },
    )
        parentCommentId: string | null

    /** Author of the comment. */
    @Field(
        () => UserEntity,
        {
            description: "Author of the comment.",
        },
    )
        author: UserEntity

    /** Number of direct replies to this comment. */
    @Field(
        () => Int,
        {
            description: "Number of direct replies to this comment.",
        },
    )
        replyCount: number

    /** Reaction summary for this comment from the viewer's view. */
    @Field(
        () => ReactionSummaryObject,
        {
            description: "Reaction summary for this comment from the viewer's view.",
        },
    )
        reactions: ReactionSummaryObject

    /** Whether the author is the founder (drives the founder badge on the FE). */
    @Field(
        () => Boolean,
        {
            description: "Whether the author is the founder.",
        },
    )
        isFounderAuthor: boolean
}
