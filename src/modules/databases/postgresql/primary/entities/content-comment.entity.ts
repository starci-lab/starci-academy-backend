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
    ContentEntity,
} from "./content.entity"
import {
    CourseEntity,
} from "./course.entity"
import {
    UserEntity,
} from "./user.entity"

@ObjectType({
    description: "A threaded comment on a lesson content or a course-general question.",
})
@Entity("content_comments")
@Index(
    "IDX_content_comments_content_parent",
    [
        "content",
        "parentComment",
    ],
)
@Index(
    "IDX_content_comments_course_parent",
    [
        "course",
        "parentComment",
    ],
)
/**
 * A threaded comment — either on a lesson content (per-lesson "Thảo luận"), OR a
 * course-general question with no specific lesson ("hỏi chung khóa"). Exactly one of
 * `content`/`course` is set (never both, never neither); enforced by a DB CHECK
 * constraint (see the migration) since TypeORM cannot express XOR at the entity level.
 * Replies point at a parent comment via `parentComment` (self relation), enabling
 * arbitrarily nested discussion. Deletion is soft (`isDeleted`) so the thread shape and
 * child replies survive.
 */
export class ContentCommentEntity extends UuidAbstractEntity {
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
     * Soft-delete flag. When true the body is hidden behind a placeholder but the row
     * (and its replies) is preserved so the thread does not collapse.
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
     * Content this comment belongs to. Null for a course-general question (see
     * `course` below) — exactly one of the two is ever set.
     */
    @ManyToOne(
        () => ContentEntity,
        {
            nullable: true,
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "content_id",
        foreignKeyConstraintName: "fk_content_id_content_comments_contents",
    })
        content: ContentEntity | null

    /**
     * Owning content id (denormalized via relation). Null for a course-general question.
     */
    @Field(
        () => ID,
        {
            nullable: true,
            description: "Owning content id; null for a course-general question.",
        },
    )
    @RelationId(
        (contentComment: ContentCommentEntity) => contentComment.content,
    )
        contentId: string | null

    /**
     * Course this comment belongs to when it has no specific lesson ("hỏi chung khóa").
     * Null for a per-lesson comment (where `content` carries the course transitively via
     * content → module → course).
     */
    @ManyToOne(
        () => CourseEntity,
        {
            nullable: true,
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "course_id",
        foreignKeyConstraintName: "fk_course_id_content_comments_courses",
    })
        course: CourseEntity | null

    /**
     * Owning course id for a course-general question (denormalized via relation). Null
     * for a per-lesson comment.
     */
    @Field(
        () => ID,
        {
            nullable: true,
            description: "Owning course id for a course-general question; null for a per-lesson comment.",
        },
    )
    @RelationId(
        (contentComment: ContentCommentEntity) => contentComment.course,
    )
        courseId: string | null

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
        foreignKeyConstraintName: "fk_user_id_content_comments_users",
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
        (contentComment: ContentCommentEntity) => contentComment.user,
    )
        userId: string

    /**
     * Parent comment for replies; null for a top-level comment.
     */
    @ManyToOne(
        () => ContentCommentEntity,
        (parent: ContentCommentEntity) => parent.replies,
        {
            nullable: true,
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "parent_comment_id",
        foreignKeyConstraintName: "fk_parent_comment_id_content_comments_content_comments",
    })
        parentComment: ContentCommentEntity | null

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
        (contentComment: ContentCommentEntity) => contentComment.parentComment,
    )
        parentCommentId: string | null

    /**
     * Direct replies to this comment.
     */
    @OneToMany(
        () => ContentCommentEntity,
        (reply: ContentCommentEntity) => reply.parentComment,
    )
        replies: Array<ContentCommentEntity>
}
