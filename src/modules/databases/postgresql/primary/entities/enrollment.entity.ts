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
/**
 * Join entity representing many-to-many enrollment between users and courses.
 */
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
     * Whether this is a REAL (committed / paid) enrollment versus a trial /
     * preview placeholder. The row may exist the moment a user engages with a
     * course (trial -> `false`); it flips to `true` when they actually
     * enroll / pay. Gates that mean "is a paying member" (capstone, milestone,
     * personal-project, premium) check THIS flag, not mere row existence --
     * activity (lesson reads, challenge submissions) is tracked regardless, but
     * a trial row must not unlock paid-only surfaces. Defaults to `true` so any
     * creation path that does not explicitly opt into a trial is treated as a
     * full enrollment (fail-safe: never lock out a payer).
     */
    @Field(
        () => Boolean,
        {
            description: "True when the user has actually enrolled/paid; false for a trial placeholder.",
        },
    )
    @Column({
        name: "is_enrolled",
        type: "boolean",
        default: true,
    })
        isEnrolled: boolean

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
     * Git branch used for personal project AI review (optional; null defaults to main in clients).
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Git branch for personal project review (null = default branch).",
        },
    )
    @Column({
        name: "personal_project_github_branch",
        type: "varchar",
        length: 255,
        nullable: true,
    })
        personalProjectGithubBranch: string | null

    /**
     * AES-256-GCM encrypted GitHub access token (JSON-stringified `{iv,authTag,ciphertext}`
     * payload) used to clone a PRIVATE personal-project repo for AI grading, or null when the
     * repo is public / no token supplied. **NOT exposed via GraphQL** -- the plaintext token must
     * never leave the server. The masked {@link personalProjectGithubTokenLast4} is what the
     * UI shows.
     */
    @Column({
        name: "personal_project_github_token_encrypted",
        type: "text",
        nullable: true,
    })
        personalProjectGithubTokenEncrypted: string | null

    /**
     * Last 4 chars of the stored GitHub token -- a log-safe masked hint for the UI
     * (`----{last4}`); the plaintext is never returned again. Null when no token is stored.
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Masked hint (last 4 chars) of the stored private-repo GitHub token; null when none.",
        },
    )
    @Column({
        name: "personal_project_github_token_last4",
        type: "varchar",
        length: 4,
        nullable: true,
    })
        personalProjectGithubTokenLast4: string | null

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
