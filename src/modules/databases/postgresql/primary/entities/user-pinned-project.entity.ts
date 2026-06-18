import {
    Field,
    ID,
    Int,
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
    GraphQLTypeProjectPinType,
    ProjectPinType,
} from "../enums"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    UserEntity,
} from "./user.entity"
import {
    EnrollmentEntity,
} from "./enrollment.entity"

/**
 * A project pinned to a user's public profile.
 *
 * Two kinds, discriminated by {@link ProjectPinType}:
 * - `course`: references one of the user's enrollments' capstone (personal
 *   project). Title is derived from the course; URL comes from
 *   `enrollment.personalProjectGithubUrl`. Eligible for the "Verified by StarCi"
 *   highlight when the linked enrollment's task plan is complete.
 * - `external`: free-form (title, description, url, techStack); never verified.
 *
 * A user may pin at most 6 projects; `orderIndex` drives display order.
 */
@ObjectType({
    description: "A project pinned to a user's public profile.",
})
@Entity("user_pinned_projects")
@Index(["user"])
export class UserPinnedProjectEntity extends UuidAbstractEntity {
    /**
     * Owner of this pin.
     */
    @Field(
        () => UserEntity,
        {
            description: "Owner of this pin.",
        },
    )
    @ManyToOne(
        () => UserEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "user_id",
        foreignKeyConstraintName:
            "fk_user_id_user_pinned_projects_users",
    })
        user: UserEntity

    /**
     * Owner user id (denormalized via relation for cheap filtering / indexing).
     */
    @Field(
        () => ID,
        {
            description: "Owner user id.",
        },
    )
    @RelationId(
        (pin: UserPinnedProjectEntity) => pin.user,
    )
        userId: string

    /**
     * Pin kind discriminator (course | external).
     */
    @Field(
        () => GraphQLTypeProjectPinType,
        {
            description: "Pin kind discriminator (course | external).",
        },
    )
    @Column({
        name: "type",
        type: "enum",
        enum: ProjectPinType,
        enumName: "project_pin_type",
    })
        type: ProjectPinType

    /**
     * Linked enrollment whose capstone this pin references. Only set for
     * `course` pins; null for `external` pins.
     */
    @Field(
        () => EnrollmentEntity,
        {
            nullable: true,
            description: "Linked enrollment whose capstone this pin references (course pins only).",
        },
    )
    @ManyToOne(
        () => EnrollmentEntity,
        {
            nullable: true,
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "enrollment_id",
        foreignKeyConstraintName:
            "fk_enrollment_id_user_pinned_projects_enrollments",
    })
        enrollment: EnrollmentEntity | null

    /**
     * Linked enrollment id (null for `external` pins).
     */
    @Field(
        () => ID,
        {
            nullable: true,
            description: "Linked enrollment id (course pins only).",
        },
    )
    @RelationId(
        (pin: UserPinnedProjectEntity) => pin.enrollment,
    )
        enrollmentId: string | null

    /**
     * Custom title. For `course` pins this overrides the course title when set,
     * otherwise the course title is used as a fallback. Required at the API
     * boundary for `external` pins.
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Custom title; course pins fall back to the course title when null.",
        },
    )
    @Column({
        name: "title",
        type: "varchar",
        length: 255,
        nullable: true,
    })
        title: string | null

    /**
     * Free-form description shown under the pin.
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Free-form description shown under the pin.",
        },
    )
    @Column({
        name: "description",
        type: "varchar",
        length: 1024,
        nullable: true,
    })
        description: string | null

    /**
     * Project URL. For `course` pins this is copied from the enrollment's
     * `personalProjectGithubUrl` at creation time.
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Project URL (course pins copy the enrollment GitHub URL).",
        },
    )
    @Column({
        name: "url",
        type: "varchar",
        length: 2048,
        nullable: true,
    })
        url: string | null

    /**
     * Technology stack tags (string array) displayed on the pin.
     */
    @Field(
        () => [String],
        {
            nullable: true,
            description: "Technology stack tags displayed on the pin.",
        },
    )
    @Column({
        name: "tech_stack",
        type: "jsonb",
        nullable: true,
    })
        techStack: Array<string> | null

    /**
     * Display order within the user's pinned-projects list (ascending).
     */
    @Field(
        () => Int,
        {
            description: "Display order within the user's pinned-projects list.",
        },
    )
    @Column({
        name: "order_index",
        type: "int",
        default: 0,
    })
        orderIndex: number
}
