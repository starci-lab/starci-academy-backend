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
    MilestoneTaskEntity,
} from "./milestone-task.entity"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    MilestoneTaskCriteriaResultEntity,
} from "./milestone-task-criteria-result.entity"


/**
 * A pass criterion belonging to a milestone task.
 */
@ObjectType({
    description: "A pass criterion for a milestone task.",
})
@Entity("milestone_task_pass_criteria")
export class MilestoneTaskPassCriteriaEntity extends UuidAbstractEntity {
    /**
     * Human-readable criterion text.
     */
    @Field(
        () => String,
        {
            description: "Human-readable criterion text.",
        },
    )
    @Column({
        name: "text",
        type: "text",
    })
        text: string

    /**
     * Display order within the task pass criteria list.
     */
    @Field(
        () => Int,
        {
            description: "Display order within the task pass criteria list.",
        },
    )
    @Column({
        name: "order_index",
        type: "int",
        default: 0,
    })
        orderIndex: number

    /**
     * LLM grading prompt text for this criterion (internal, not displayed to users).
     */
    @Column({
        name: "prompt_text",
        type: "text",
        default: "",
    })
        promptText: string

    /**
     * Default locale for this criterion.
     */
    @Field(
        () => GraphQLTypeLocale,
        {
            description: "Default locale for this criterion row.",
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
     * Milestone task this criterion belongs to.
     */
    @Field(
        () => MilestoneTaskEntity,
        {
            description: "Milestone task this criterion belongs to.",
        },
    )
    @ManyToOne(
        () => MilestoneTaskEntity,
        (task: MilestoneTaskEntity) => task.passCriteria,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "milestone_task_id",
        foreignKeyConstraintName:
            "fk_milestone_task_id_milestone_task_pass_criteria_milestone_tasks",
    })
        milestoneTask: MilestoneTaskEntity

    @Field(
        () => ID,
        {
            description: "Parent milestone task ID.",
        },
    )
    @RelationId(
        (c: MilestoneTaskPassCriteriaEntity) => c.milestoneTask,
    )
        milestoneTaskId: string

    /**
     * Grading results for this criterion across all attempts.
     */
    @OneToMany(
        () => MilestoneTaskCriteriaResultEntity,
        (criteriaResult: MilestoneTaskCriteriaResultEntity) => criteriaResult.passCriteria,
    )
        criteriaResults: Array<MilestoneTaskCriteriaResultEntity>
}
