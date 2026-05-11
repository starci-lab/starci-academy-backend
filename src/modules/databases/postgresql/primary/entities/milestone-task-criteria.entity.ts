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
    MilestoneTaskCriteriaTranslationEntity,
} from "./milestone-task-criteria-translation.entity"

/**
 * A pass criterion belonging to a milestone task.
 * Translatable fields (text, promptText) live in translations.
 */
@ObjectType({
    description: "A pass criterion for a milestone task.",
})
@Entity("milestone_task_criteria")
export class MilestoneTaskCriteriaEntity extends UuidAbstractEntity {
    /**
     * Criterion text.
     */
    @Field(
        () => String,
        {
            description: "Criterion text.",
        },
    )
    @Column({
        name: "text",
        type: "text",
        default: "",
    })
        text: string

    /**
     * Criterion hint.
     */
    @Field(
        () => String,
        {
            description: "Criterion hint.",
        },
    )
    @Column({
        name: "hint",
        type: "text",
        default: "",
    })
        hint: string

    /**
     * Prompt text for AI grading.
     */
    @Field(
        () => String,
        {
            description: "Criterion prompt text for AI grading.",
        },
    )
    @Column({
        name: "prompt_text",
        type: "text",
        default: "",
    })
        promptText: string

    /**
     * Display order within the task criteria list.
     */
    @Field(
        () => Int,
        {
            description: "Display order within the task criteria list.",
        },
    )
    @Column({
        name: "order_index",
        type: "int",
        default: 0,
    })
        orderIndex: number

    /**
     * Score awarded when this criterion passes (0 if failed).
     */
    @Field(
        () => Int,
        {
            description: "Score awarded when this criterion passes.",
        },
    )
    @Column({
        name: "score",
        type: "int",
        default: 0,
    })
        score: number

    /**
     * Default locale for this criterion.
     */
    @Field(
        () => GraphQLTypeLocale,
        {
            description: "Default locale for this criterion.",
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
        (milestoneTask: MilestoneTaskEntity) => milestoneTask.criterias,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "milestone_task_id",
        foreignKeyConstraintName:
            "fk_milestone_task_id_milestone_task_criteria_milestone_tasks",
    })
        milestoneTask: MilestoneTaskEntity

    @Field(
        () => ID,
        {
            description: "Parent milestone task ID.",
        },
    )
    @RelationId(
        (c: MilestoneTaskCriteriaEntity) => c.milestoneTask,
    )
        milestoneTaskId: string

    /**
     * Localized translations of criteria fields (text, promptText).
     */
    @Field(
        () => [MilestoneTaskCriteriaTranslationEntity],
        {
            description: "Localized translations of criteria fields.",
        },
    )
    @OneToMany(
        () => MilestoneTaskCriteriaTranslationEntity,
        (translation: MilestoneTaskCriteriaTranslationEntity) => translation.milestoneTaskCriteria,
        {
            cascade: true,
        },
    )
        translations: Array<MilestoneTaskCriteriaTranslationEntity>
}
