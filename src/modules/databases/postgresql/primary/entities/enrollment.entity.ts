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
    GraphQLTypeTaskPlanStatus,
    GraphQLTypePricingPhase,
    TaskPlanStatus,
    PricingPhase,
} from "../enums"
import {
    UserMilestoneTaskEntity,
} from "./user-milestone-task.entity"

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
     * Current status of the task plan.
     */
    @Field(
        () => GraphQLTypeTaskPlanStatus,
        {
            description: "Current progress status of the enrollment's task plan.",
        },
    )
    @Column({
        name: "task_plan_status",
        type: "enum",
        enum: TaskPlanStatus,
        enumName: "task_plan_status",
        default: TaskPlanStatus.Locked,
    })
        taskPlanStatus: TaskPlanStatus

    /**
     * Timestamp when all tasks were completed (null if not yet).
     */
    @Field(
        () => Date,
        {
            nullable: true,
            description: "Timestamp when the task plan was completed.",
        },
    )
    @Column({
        name: "tasks_completed_at",
        type: "timestamptz",
        nullable: true,
    })
        tasksCompletedAt: Date | null

    /**
     * User milestone tasks belonging to this enrollment.
     */
    @Field(
        () => [UserMilestoneTaskEntity],
        {
            description: "User milestone tasks belonging to this enrollment.",
        },
    )
    @OneToMany(
        () => UserMilestoneTaskEntity,
        (task: UserMilestoneTaskEntity) => task.enrollment,
        {
            cascade: true,
        },
    )
        userMilestoneTasks: Array<UserMilestoneTaskEntity>
}
