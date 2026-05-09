import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    Unique,
    Column,
    RelationId,
} from "typeorm"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    CourseEntity,
} from "./course.entity"
import {
    UserEntity,
} from "./user.entity"
import {
    GraphQLTypeMilestoneStatus,
    GraphQLTypePricingPhase,
    MilestoneStatus,
    PricingPhase,
} from "../enums"
import {
    MilestoneEntity,
} from "./milestone.entity"
import {
    PersonalProjectAttemptEntity,
} from "./personal-project-attempt.entity"

/**
 * Join entity representing many-to-many enrollment between users and courses.
 */
@ObjectType({
    description: "Enrollment relation between a user and a course.",
})
@Entity("enrollments")
@Unique(
    "UQ_enrollments_user_course",
    [
        "user",
        "course",
    ],
)
export class EnrollmentEntity extends UuidAbstractEntity {
    @Field(
        () => UserEntity,
        {
            description: "User who enrolled.",
        },
    )
    @ManyToOne(
        () => UserEntity,
        (user: UserEntity) => user.enrollments,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "user_id",
        foreignKeyConstraintName: "fk_user_id_enrollments_users",
    })
        user: UserEntity

    @Field(
        () => CourseEntity,
        {
            description: "Course the user enrolled in.",
        },
    )
    @ManyToOne(
        () => CourseEntity,
        (course: CourseEntity) => course.enrollments,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "course_id",
        foreignKeyConstraintName: "fk_course_id_enrollments_courses",
    })
        course: CourseEntity

    @Field(() => String,
        {
            description: "The ID of the user who enrolled in the course."
        })
    @RelationId(
        (enrollment: EnrollmentEntity) => enrollment.user,
    )
        userId: string

    @Field(() => String,
        {
            description: "The ID of the course that the user enrolled in."
        })
    @RelationId(
        (enrollment: EnrollmentEntity) => enrollment.course,
    )
        courseId: string

    @Field(() => GraphQLTypePricingPhase,
        {
            description: "The pricing phase that the user enrolled in."
        })
    @Column({
        name: "pricing_phase",
        type: "enum",
        enum: PricingPhase,
    })
        pricingPhase: PricingPhase

    /**
     * User's personal project idea text at enrollment level.
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "User's personal project idea text at enrollment level.",
        },
    )
    @Column({
        name: "idea_text",
        type: "text",
        nullable: true,
    })
        ideaText: string | null

    /**
     * User's submitted personal project GitHub URL at enrollment level.
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "User's submitted personal project GitHub URL at enrollment level.",
        },
    )
    @Column({
        name: "personal_project_github_url",
        type: "varchar",
        length: 2048,
        nullable: true,
    })
        personalProjectGithubUrl: string | null

    /**
     * Current status of the milestone plan.
     */
    @Field(
        () => GraphQLTypeMilestoneStatus,
        {
            description: "Current progress status of the enrollment's milestone plan.",
        },
    )
    @Column({
        name: "milestone_status",
        type: "enum",
        enum: MilestoneStatus,
        enumName: "milestone_status",
        default: MilestoneStatus.Locked,
    })
        milestoneStatus: MilestoneStatus

    /**
     * Timestamp when all milestones were completed (null if not yet).
     */
    @Field(
        () => Date,
        {
            nullable: true,
            description: "Timestamp when the milestone plan was completed.",
        },
    )
    @Column({
        name: "milestones_completed_at",
        type: "timestamptz",
        nullable: true,
    })
        milestonesCompletedAt: Date | null

    /**
     * Milestones belonging to this enrollment.
     */
    @Field(
        () => [MilestoneEntity],
        {
            description: "Milestones belonging to this enrollment.",
        },
    )
    @OneToMany(
        () => MilestoneEntity,
        (milestone: MilestoneEntity) => milestone.enrollment,
        {
            cascade: true,
        },
    )
        milestones: Array<MilestoneEntity>

    /**
     * Personal project review attempts linked to this enrollment.
     */
    @OneToMany(
        () => PersonalProjectAttemptEntity,
        (attempt: PersonalProjectAttemptEntity) => attempt.enrollment,
    )
        attempts: Array<PersonalProjectAttemptEntity>
}
