import {
    Field,
    ID,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    CommunityChannel,
    GraphQLTypeCommunityChannel,
    UserEntity,
} from "@modules/databases"
import {
    ReactionSummaryObject,
} from "../../discussion"

/** A single community post shaped for the client (author + counts + reactions). */
@ObjectType({
    description: "A community feed post with author, comment count and reaction summary.",
})
export class CommunityPostNodeObject {
    /** Post primary id. */
    @Field(
        () => ID,
        {
            description: "Post primary id.",
        },
    )
        id: string

    /** Post body (already a placeholder when soft-deleted, see `isDeleted`). */
    @Field(
        () => String,
        {
            description: "Post body authored by the user (markdown).",
        },
    )
        body: string

    /** Channel the post belongs to. */
    @Field(
        () => GraphQLTypeCommunityChannel,
        {
            description: "Channel the post belongs to.",
        },
    )
        channel: CommunityChannel

    /** Whether the post is pinned to the top of its channel. */
    @Field(
        () => Boolean,
        {
            description: "Whether the post is pinned to the top of its channel.",
        },
    )
        isPinned: boolean

    /** Whether the post was soft-deleted by its author. */
    @Field(
        () => Boolean,
        {
            description: "Whether the post was soft-deleted by its author.",
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

    /** Author of the post. */
    @Field(
        () => UserEntity,
        {
            description: "Author of the post.",
        },
    )
        author: UserEntity

    /** Number of comments on this post. */
    @Field(
        () => Int,
        {
            description: "Number of comments on this post.",
        },
    )
        commentCount: number

    /** Reaction summary for this post from the viewer's view. */
    @Field(
        () => ReactionSummaryObject,
        {
            description: "Reaction summary for this post from the viewer's view.",
        },
    )
        reactions: ReactionSummaryObject

    /** Whether the viewing user authored this post. */
    @Field(
        () => Boolean,
        {
            description: "Whether the viewing user authored this post.",
        },
    )
        isMine: boolean

    /** Whether the author is the founder (drives the founder badge on the FE). */
    @Field(
        () => Boolean,
        {
            description: "Whether the author is the founder.",
        },
    )
        isFounderAuthor: boolean
}
