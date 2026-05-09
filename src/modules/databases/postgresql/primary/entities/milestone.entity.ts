import {
    Field,
    ID,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    GraphQLTypeLocale,
    Locale,
} from "../enums"
import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    RelationId,
} from "typeorm"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    MilestoneTaskEntity,
} from "./milestone-task.entity"
import {
    EnrollmentEntity,
} from "./enrollment.entity"

/**
 * A milestone belonging to a user's enrollment.
 * AI-generated directly in the target locale — no translation table needed.
 */
@ObjectType({
    description: "A milestone belonging to a user's enrollment.",
})
@Entity("milestones")
export class MilestoneEntity extends UuidAbstractEntity {
    /**
     * Human-readable milestone title (in the generated locale).
     */
    @Field(
        () => String,
        {
            description: "Human-readable milestone title.",
        },
    )
    @Column({
        name: "title",
        type: "varchar",
        length: 255,
    })
        title: string

    /**
     * Week number for this milestone (1-based).
     */
    @Field(
        () => Int,
        {
            description: "Week number for this milestone (1-based).",
        },
    )
    @Column({
        name: "week",
        type: "int",
    })
        week: number

    /**
     * Display order within the enrollment's milestone list.
     */
    @Field(
        () => Int,
        {
            description: "Display order within the enrollment's milestone list.",
        },
    )
    @Column({
        name: "order_index",
        type: "int",
        default: 0,
    })
        orderIndex: number

    /**
     * Locale in which this milestone was generated.
     */
    @Field(
        () => GraphQLTypeLocale,
        {
            description: "Locale in which this milestone was generated.",
        },
    )
    @Column({
        name: "default_locale",
        type: "enum",
        enum: Locale,
        enumName: "locale",
    })
        defaultLocale: Locale

    /**
     * Ordered tasks belonging to this milestone.
     */
    @Field(
        () => [MilestoneTaskEntity],
        {
            description: "Ordered tasks belonging to this milestone.",
        },
    )
    @OneToMany(
        () => MilestoneTaskEntity,
        (task: MilestoneTaskEntity) => task.milestone,
        {
            cascade: true,
        },
    )
        tasks: Array<MilestoneTaskEntity>

    /**
     * Enrollment that this milestone belongs to.
     */
    @Field(
        () => EnrollmentEntity,
        {
            description: "Enrollment that this milestone belongs to.",
        },
    )
    @ManyToOne(
        () => EnrollmentEntity,
        (enrollment: EnrollmentEntity) => enrollment.milestones,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "enrollment_id",
        foreignKeyConstraintName: "fk_enrollment_id_milestones_enrollments",
    })
        enrollment: EnrollmentEntity

    @Field(
        () => ID,
        {
            description: "Enrollment ID.",
        },
    )
    @RelationId(
        (milestone: MilestoneEntity) => milestone.enrollment,
    )
        enrollmentId: string
}
