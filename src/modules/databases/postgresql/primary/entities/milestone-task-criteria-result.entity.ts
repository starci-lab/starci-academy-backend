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
} from "typeorm"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    MilestoneTaskResultEntity,
} from "./milestone-task-result.entity"
import {
    MilestoneTaskPassCriteriaEntity,
} from "./milestone-task-pass-criteria.entity"

/**
 * Result of grading a single pass criterion within a task result.
 * Each criterion is independently evaluated; the parent task passes
 * only when every criterion result has `passed = true`.
 */
@ObjectType({
    description: "Result of grading a single pass criterion within a task result.",
})
@Entity("milestone_task_criteria_results")
export class MilestoneTaskCriteriaResultEntity extends UuidAbstractEntity {
    /**
     * Whether this criterion passed.
     */
    @Field(
        () => Boolean,
        {
            description: "Whether this criterion passed.",
        },
    )
    @Column({
        name: "passed",
        type: "boolean",
        default: false,
    })
        passed: boolean

    /**
     * LLM-generated feedback explaining why this criterion passed or failed.
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "LLM-generated feedback explaining why this criterion passed or failed.",
        },
    )
    @Column({
        name: "feedback",
        type: "text",
        nullable: true,
    })
        feedback: string | null

    /**
     * The parent task result this criterion result belongs to.
     */
    @Field(
        () => MilestoneTaskResultEntity,
        {
            description: "The parent task result this criterion result belongs to.",
        },
    )
    @ManyToOne(
        () => MilestoneTaskResultEntity,
        (taskResult: MilestoneTaskResultEntity) => taskResult.criteriaResults,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "task_result_id",
        foreignKeyConstraintName:
            "fk_task_result_id_milestone_task_criteria_results_milestone_task_results",
    })
        taskResult: MilestoneTaskResultEntity

    @Field(
        () => ID,
        {
            description: "Parent task result ID.",
        },
    )
    @RelationId(
        (criteriaResult: MilestoneTaskCriteriaResultEntity) => criteriaResult.taskResult,
    )
        taskResultId: string

    /**
     * The pass criterion definition that was evaluated.
     */
    @Field(
        () => MilestoneTaskPassCriteriaEntity,
        {
            description: "The pass criterion definition that was evaluated.",
        },
    )
    @ManyToOne(
        () => MilestoneTaskPassCriteriaEntity,
        (criteria: MilestoneTaskPassCriteriaEntity) => criteria.criteriaResults,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "pass_criteria_id",
        foreignKeyConstraintName:
            "fk_pass_criteria_id_milestone_task_criteria_results_milestone_task_pass_criteria",
    })
        passCriteria: MilestoneTaskPassCriteriaEntity

    @Field(
        () => ID,
        {
            description: "Parent pass criteria ID.",
        },
    )
    @RelationId(
        (criteriaResult: MilestoneTaskCriteriaResultEntity) => criteriaResult.passCriteria,
    )
        passCriteriaId: string
}
