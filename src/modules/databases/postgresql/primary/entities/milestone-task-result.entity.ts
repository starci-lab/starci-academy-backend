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
    OneToMany,
    RelationId,
} from "typeorm"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    PersonalProjectAttemptEntity,
} from "./personal-project-attempt.entity"
import {
    MilestoneTaskEntity,
} from "./milestone-task.entity"
import {
    MilestoneTaskCriteriaResultEntity,
} from "./milestone-task-criteria-result.entity"

/**
 * Result of grading a single milestone task within a review attempt.
 * A task is considered "passed" only when ALL of its criteria results are passed.
 */
@ObjectType({
    description: "Result of grading a single milestone task within a review attempt.",
})
@Entity("milestone_task_results")
export class MilestoneTaskResultEntity extends UuidAbstractEntity {
    /**
     * Whether the task passed (all criteria passed).
     */
    @Field(
        () => Boolean,
        {
            description: "Whether the task passed (all criteria passed).",
        },
    )
    @Column({
        name: "passed",
        type: "boolean",
        default: false,
    })
        passed: boolean

    /**
     * The review attempt this result belongs to.
     */
    @Field(
        () => PersonalProjectAttemptEntity,
        {
            description: "The review attempt this result belongs to.",
        },
    )
    @ManyToOne(
        () => PersonalProjectAttemptEntity,
        (attempt: PersonalProjectAttemptEntity) => attempt.taskResults,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "attempt_id",
        foreignKeyConstraintName:
            "fk_attempt_id_milestone_task_results_personal_project_attempts",
    })
        attempt: PersonalProjectAttemptEntity

    @Field(
        () => ID,
        {
            description: "Parent attempt ID.",
        },
    )
    @RelationId(
        (result: MilestoneTaskResultEntity) => result.attempt,
    )
        attemptId: string

    /**
     * The milestone task that was graded.
     */
    @Field(
        () => MilestoneTaskEntity,
        {
            description: "The milestone task that was graded.",
        },
    )
    @ManyToOne(
        () => MilestoneTaskEntity,
        (task: MilestoneTaskEntity) => task.taskResults,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "milestone_task_id",
        foreignKeyConstraintName:
            "fk_milestone_task_id_milestone_task_results_milestone_tasks",
    })
        milestoneTask: MilestoneTaskEntity

    @Field(
        () => ID,
        {
            description: "Parent milestone task ID.",
        },
    )
    @RelationId(
        (result: MilestoneTaskResultEntity) => result.milestoneTask,
    )
        milestoneTaskId: string

    /**
     * Per-criteria grading results for this task.
     */
    @Field(
        () => [MilestoneTaskCriteriaResultEntity],
        {
            nullable: true,
            description: "Per-criteria grading results for this task.",
        },
    )
    @OneToMany(
        () => MilestoneTaskCriteriaResultEntity,
        (criteriaResult: MilestoneTaskCriteriaResultEntity) => criteriaResult.taskResult,
        {
            cascade: true,
        },
    )
        criteriaResults: Array<MilestoneTaskCriteriaResultEntity>
}
