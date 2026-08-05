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
    OneToMany,
    RelationId,
} from "typeorm"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    CommunityPostEntity,
} from "./community-post.entity"
import {
    UserEntity,
} from "./user.entity"

@ObjectType({
    description: "A threaded comment on a community post (supports nested replies).",
})
@Entity("community_post_comments")
@Index(
    "IDX_community_post_comments_post_parent",
    [
        "post",
        "parentComment",
    ],
)
/**
 * A threaded comment on a community post. Replies point at a parent comment via
 * `parentComment` (self relation), enabling arbitrarily nested discussion.
 * Mirrors {@link ContentCommentEntity} but scoped to a {@link CommunityPostEntity}
 * instead of a lesson content. Deletion is soft (`isDeleted`) so the thread shape
 * and child replies survive.
 */
export class CommunityPostCommentEntity extends UuidAbstractEntity {
    /**
     * Raw markdown/plain body authored by the user.
     */
    @Field(
        () => String,
        {
            description: "Comment body authored by the user.",
        },
    )
    @Column({
        name: "body",
        type: "text",
    })
        body: string

    /**
     * Soft-delete flag. When true the body is hidden behind a placeholder but the
     * row (and its replies) is preserved so the thread does not collapse.
     */
    @Field(
        () => Boolean,
        {
            description: "Whether the comment was soft-deleted by its author.",
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
     * Post this comment belongs to.
     */
    @ManyToOne(
        () => CommunityPostEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "post_id",
        foreignKeyConstraintName: "fk_post_id_community_post_comments_community_posts",
    })
        post: CommunityPostEntity

    /**
     * Owning post id (denormalized via relation).
     */
    @Field(
        () => ID,
        {
            description: "Owning post id.",
        },
    )
    @RelationId(
        (postComment: CommunityPostCommentEntity) => postComment.post,
    )
        postId: string

    /**
     * Author of the comment.
     */
    @ManyToOne(
        () => UserEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "user_id",
        foreignKeyConstraintName: "fk_user_id_community_post_comments_users",
    })
        user: UserEntity

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
        (postComment: CommunityPostCommentEntity) => postComment.user,
    )
        userId: string

    /**
     * Parent comment for replies; null for a top-level comment.
     */
    @ManyToOne(
        () => CommunityPostCommentEntity,
        (parent: CommunityPostCommentEntity) => parent.replies,
        {
            nullable: true,
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "parent_comment_id",
        foreignKeyConstraintName:
            "fk_parent_comment_id_community_post_comments_community_post_comments",
    })
        parentComment: CommunityPostCommentEntity | null

    /**
     * Parent comment id (null for top-level comments).
     */
    @Field(
        () => ID,
        {
            nullable: true,
            description: "Parent comment id (null for top-level comments).",
        },
    )
    @RelationId(
        (postComment: CommunityPostCommentEntity) => postComment.parentComment,
    )
        parentCommentId: string | null

    /**
     * Direct replies to this comment.
     */
    @OneToMany(
        () => CommunityPostCommentEntity,
        (reply: CommunityPostCommentEntity) => reply.parentComment,
    )
        replies: Array<CommunityPostCommentEntity>
}
