import {
    Field,
    ID,
    Int,
    ObjectType,
} from "@nestjs/graphql"
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
    EnrollmentEntity,
} from "./enrollment.entity"
import {
    MilestoneTaskEntity,
} from "./milestone-task.entity"
import {
    UserMilestoneTaskAttemptEntity,
} from "./user-milestone-task-attempt.entity"

/**
 * Links a user's enrollment to a specific milestone task.
 * Created when a user starts working on a milestone task.
 */
@ObjectType({
    description: "Links a user enrollment to a milestone task.",
})
@Entity("user_milestone_tasks")
export class UserMilestoneTaskEntity extends UuidAbstractEntity {
    /**
     * Display order within the enrollment's task list.
     */
    @Field(
        () => Int,
        {
            description: "Display order within the enrollment's task list.",
        },
    )
    @Column({
        name: "order_index",
        type: "int",
        default: 0,
    })
        orderIndex: number

    @Field(() => Int,
        {
            description: "Pure ordering index used to reorder the list (decoupled from orderIndex)." 
        })
    @Column({
        name: "sort_index", type: "int", default: 0 
    })
        sortIndex: number

    /**
     * Enrollment this user milestone task belongs to.
     */
    @Field(
        () => EnrollmentEntity,
        {
            description: "Enrollment this user milestone task belongs to.",
        },
    )
    @ManyToOne(
        () => EnrollmentEntity,
        (enrollment: EnrollmentEntity) => enrollment.userMilestoneTasks,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "enrollment_id",
        foreignKeyConstraintName:
            "fk_enrollment_id_user_milestone_tasks_enrollments",
    })
        enrollment: EnrollmentEntity

    @Field(
        () => ID,
        {
            description: "Parent enrollment ID.",
        },
    )
    @RelationId(
        (t: UserMilestoneTaskEntity) => t.enrollment,
    )
        enrollmentId: string

    /**
     * The milestone task this user is working on.
     */
    @Field(
        () => MilestoneTaskEntity,
        {
            description: "The milestone task this user is working on.",
        },
    )
    @ManyToOne(
        () => MilestoneTaskEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "milestone_task_id",
        foreignKeyConstraintName:
            "fk_milestone_task_id_user_milestone_tasks_milestone_tasks",
    })
        milestoneTask: MilestoneTaskEntity

    @Field(
        () => ID,
        {
            description: "Parent milestone task ID.",
        },
    )
    @RelationId(
        (userMilestoneTask: UserMilestoneTaskEntity) => userMilestoneTask.milestoneTask,
    )
        milestoneTaskId: string

    /**
     * Review attempts for this user milestone task.
     */
    @Field(
        () => [UserMilestoneTaskAttemptEntity],
        {
            nullable: true,
            description: "Review attempts for this user milestone task.",
        },
    )
    @OneToMany(
        () => UserMilestoneTaskAttemptEntity,
        (attempt: UserMilestoneTaskAttemptEntity) => attempt.userMilestoneTask,
        {
            cascade: true,
        },
    )
        attempts: Array<UserMilestoneTaskAttemptEntity>
}
