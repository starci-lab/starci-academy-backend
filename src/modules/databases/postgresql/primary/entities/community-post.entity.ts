import {
    Field,
    ID,
    ObjectType,
} from "@nestjs/graphql"
import {
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    RelationId,
} from "typeorm"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    UserEntity,
} from "./user.entity"
import {
    CommunityChannel,
    GraphQLTypeCommunityChannel,
} from "../enums"

/**
 * A user-authored community post (the Facebook/Twitter-style feed item). Unlike
 * {@link ActivityEntity} (a system-generated activity ledger), a post is free-text
 * content the author writes themselves. Posts carry threaded comments
 * ({@link CommunityPostCommentEntity}) and reactions
 * ({@link CommunityPostReactionEntity}). Deletion is soft (`isDeleted`) so a
 * deleted post keeps its comment thread shape.
 */
@ObjectType({
    description: "A user-authored community feed post (text/markdown).",
})
@Entity("community_posts")
@Index(
    "IDX_community_posts_channel_created",
    [
        "channel",
        "createdAt",
    ],
)
export class CommunityPostEntity extends UuidAbstractEntity {
    /**
     * Raw markdown/plain body authored by the user.
     */
    @Field(
        () => String,
        {
            description: "Post body authored by the user (markdown).",
        },
    )
    @Column({
        name: "body",
        type: "text",
    })
        body: string

    /**
     * Channel this post belongs to (drives feed filtering).
     */
    @Field(
        () => GraphQLTypeCommunityChannel,
        {
            description: "Channel this post belongs to.",
        },
    )
    @Column({
        name: "channel",
        type: "enum",
        enum: CommunityChannel,
        enumName: "community_channel",
        default: CommunityChannel.General,
    })
        channel: CommunityChannel

    /**
     * Whether the post is pinned to the top of its channel (founder-only action).
     */
    @Field(
        () => Boolean,
        {
            description: "Whether the post is pinned to the top of its channel.",
        },
    )
    @Column({
        name: "is_pinned",
        type: "boolean",
        default: false,
    })
        isPinned: boolean

    /**
     * Soft-delete flag. When true the body is hidden behind a placeholder but the
     * row (and its comments) is preserved so the thread does not collapse.
     */
    @Field(
        () => Boolean,
        {
            description: "Whether the post was soft-deleted by its author.",
        },
    )
    @Column({
        name: "is_deleted",
        type: "boolean",
        default: false,
    })
        isDeleted: boolean

    /**
     * Timestamp of the last edit by the author (null if never edited).
     */
    @Field(
        () => Date,
        {
            nullable: true,
            description: "Timestamp of the last edit by the author (null if never edited).",
        },
    )
    @Column({
        name: "edited_at",
        type: "timestamptz",
        nullable: true,
    })
        editedAt: Date | null

    /**
     * Author of the post.
     */
    @ManyToOne(
        () => UserEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "author_id",
        foreignKeyConstraintName: "fk_author_id_community_posts_users",
    })
        author: UserEntity

    /**
     * Author user id (denormalized via relation).
     */
    @Field(
        () => ID,
        {
            description: "Author user id.",
        },
    )
    @RelationId(
        (communityPost: CommunityPostEntity) => communityPost.author,
    )
        authorId: string
}
