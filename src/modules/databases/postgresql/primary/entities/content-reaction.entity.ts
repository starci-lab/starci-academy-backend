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
    ContentEntity,
} from "./content.entity"
import {
    UserEntity,
} from "./user.entity"
import {
    EnrollmentEntity,
} from "./enrollment.entity"
import {
    GraphQLTypeReactionType,
    ReactionType,
} from "../enums"

@ObjectType({
    description: "A user's Facebook-style reaction on a lesson content.",
})
@Entity("content_reactions")
@Unique(
    "UQ_content_reactions_content_user",
    [
        "content",
        "user",
    ],
)
/**
 * A single user's reaction on a lesson content. A user holds at most one reaction
 * per content (enforced by the composite unique); changing the emotion updates the row.
 */
export class ContentReactionEntity extends UuidAbstractEntity {
    /**
     * The emotion kind the user dropped on the content.
     */
    @Field(
        () => GraphQLTypeReactionType,
        {
            description: "The emotion kind the user dropped on the content.",
        },
    )
    @Column({
        name: "type",
        type: "enum",
        enum: ReactionType,
        enumName: "reaction_type",
    })
        type: ReactionType

    /**
     * Content the reaction belongs to.
     */
    @ManyToOne(
        () => ContentEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "content_id",
        foreignKeyConstraintName: "fk_content_id_content_reactions_contents",
    })
        content: ContentEntity

    /**
     * Owning content id (denormalized via relation).
     */
    @Field(
        () => ID,
        {
            description: "Owning content id.",
        },
    )
    @RelationId(
        (contentReaction: ContentReactionEntity) => contentReaction.content,
    )
        contentId: string

    /**
     * User who reacted. Nullable during the enrollment re-key transition;
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
        foreignKeyConstraintName: "fk_user_id_content_reactions_users",
    })
        user: UserEntity | null

    /**
     * Reacting user id (denormalized via relation).
     */
    @Field(
        () => ID,
        {
            nullable: true,
            description: "Reacting user id.",
        },
    )
    @RelationId(
        (contentReaction: ContentReactionEntity) => contentReaction.user,
    )
        userId: string | null

    /**
     * Enrollment this reaction belongs to (user × course). The anchor for
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
        foreignKeyConstraintName: "fk_enrollment_id_content_reactions",
    })
        enrollment: EnrollmentEntity | null

    @RelationId(
        (contentReaction: ContentReactionEntity) => contentReaction.enrollment,
    )
        enrollmentId: string | null
}
