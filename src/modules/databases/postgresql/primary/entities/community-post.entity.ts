import {
    Field,
    ID,
    ObjectType,
} from "@nestjs/graphql"
import {
    Column,
    Check,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    RelationId,
} from "typeorm"
import {
    CourseEntity 
} from "./course.entity"
import {
    CommunityScope 
} from "../enums/community-scope"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    UserEntity,
} from "./user.entity"
import {
    CommunityChannel,
    GraphQLTypeCommunityChannel,
} from "../enums/community-channel"

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
@Index(
    "idx_course_community_feed",
    (): Partial<Record<keyof CommunityPostEntity, number>> => ({
        course: 1,
        createdAt: -1,
        id: -1,
    }),
    {
        where: "\"scope\" = 'COURSE' AND \"is_deleted\" = false",
    },
)
@Index(
    "idx_course_community_mine",
    (): Partial<Record<keyof CommunityPostEntity, number>> => ({
        course: 1,
        author: 1,
        createdAt: -1,
        id: -1,
    }),
    {
        where: "\"scope\" = 'COURSE' AND \"is_deleted\" = false",
    },
)
@Index("idx_course_community_search",
    {
        synchronize: false,
    })
@Check(
    "chk_community_posts_scope_course",
    "(\"scope\" = 'GLOBAL' AND \"course_id\" IS NULL) OR (\"scope\" = 'COURSE' AND \"course_id\" IS NOT NULL)",
)
@Check(
    "chk_course_community_not_pinned",
    "\"scope\" <> 'COURSE' OR \"is_pinned\" = false",
)
@Check(
    "chk_course_community_general_channel",
    "\"scope\" <> 'COURSE' OR \"channel\" = 'general'",
)
/**
 * A user-authored community post (the Facebook/Twitter-style feed item). Unlike
 * {@link ActivityEntity} (a system-generated activity ledger), a post is free-text
 * content the author writes themselves. Posts carry threaded comments
 * ({@link CommunityPostCommentEntity}) and reactions
 * ({@link CommunityPostReactionEntity}). Deletion is soft (`isDeleted`) so a
 * deleted post keeps its comment thread shape.
 */
export class CommunityPostEntity extends UuidAbstractEntity {
    @Column({
        name: "scope",
        type: "enum",
        enum: CommunityScope,
        enumName: "community_scope",
        default: CommunityScope.Global,
    })
        scope: CommunityScope

    @ManyToOne(() => CourseEntity,
        {
            nullable: true,
            onDelete: "RESTRICT",
        })
    @JoinColumn({
        name: "course_id",
        foreignKeyConstraintName: "fk_community_posts_course_id",
    })
        course: CourseEntity | null

    @RelationId((post: CommunityPostEntity) => post.course)
        courseId: string | null
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
