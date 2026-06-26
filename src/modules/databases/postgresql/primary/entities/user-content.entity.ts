import {
    Field,
    ID,
    ObjectType,
} from "@nestjs/graphql"
import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    RelationId,
    Unique,
} from "typeorm"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    UserEntity,
} from "./user.entity"
import {
    EnrollmentEntity,
} from "./enrollment.entity"
import {
    ContentEntity,
} from "./content.entity"

/**
 * Tracks a user's interaction with a specific content row (read status, favorites).
 */
@ObjectType({
    description: "User's interaction state with a specific content (read, favorite).",
})
@Entity("user_contents")
@Unique(["userId",
    "contentId"])
export class UserContentEntity extends UuidAbstractEntity {
    /**
     * User who owns this state. Nullable during the enrollment re-key transition;
     * reads/writes go through {@link enrollment} going forward.
     */
    @ManyToOne(
        () => UserEntity,
        {
            onDelete: "CASCADE",
            nullable: true,
        },
    )
    @JoinColumn({
        name: "user_id",
        foreignKeyConstraintName: "fk_user_id_user_contents_users",
    })
        user: UserEntity | null

    @Field(
        () => ID,
        {
            nullable: true,
            description: "User ID.",
        },
    )
    @Column({
        name: "user_id",
        type: "uuid",
        nullable: true,
    })
        userId: string | null

    /**
     * Enrollment this content state belongs to (user × course). The anchor for
     * per-course progress going forward; nullable while the re-key backfill runs.
     */
    @ManyToOne(
        () => EnrollmentEntity,
        {
            onDelete: "CASCADE",
            nullable: true,
        },
    )
    @JoinColumn({
        name: "enrollment_id",
        foreignKeyConstraintName: "fk_enrollment_id_user_contents",
    })
        enrollment: EnrollmentEntity | null

    @RelationId(
        (userContent: UserContentEntity) => userContent.enrollment,
    )
        enrollmentId: string | null

    /**
     * Content this state refers to.
     */
    @ManyToOne(
        () => ContentEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "content_id",
        foreignKeyConstraintName: "fk_content_id_user_contents_contents",
    })
        content: ContentEntity

    @Field(
        () => ID,
        {
            description: "Content ID.",
        },
    )
    @Column({
        name: "content_id",
        type: "uuid",
    })
        contentId: string

    /**
     * Whether the user has marked this content as read.
     */
    @Field(
        () => Boolean,
        {
            description: "Whether the user has marked this content as read.",
        },
    )
    @Column({
        name: "is_read",
        type: "boolean",
        default: false,
    })
        isRead: boolean

    /**
     * Whether the user has favorited this content.
     */
    @Field(
        () => Boolean,
        {
            description: "Whether the user has favorited this content.",
        },
    )
    @Column({
        name: "is_favorite",
        type: "boolean",
        default: false,
    })
        isFavorite: boolean
}
