import {
    Field,
    ID,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    GraphQLTypeLocale,
    GraphQLTypePersonalProjectTaskType,
    Locale,
    PersonalProjectTaskType,
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
    MilestoneEntity,
} from "./milestone.entity"
import {
    MilestoneTaskTranslationEntity,
} from "./milestone-task-translation.entity"
import {
    MilestoneTaskCriteriaEntity,
} from "./milestone-task-criteria.entity"

/**
 * A task belonging to a milestone.
 * Seeded from `.mount/data/courses/{course}/tasks/{milestone}/{task}/`.
 * Translatable fields (title, description) live in translations.
 */
@ObjectType({
    description: "A task belonging to a milestone.",
})
@Entity("milestone_tasks")
export class MilestoneTaskEntity extends UuidAbstractEntity {
    /**
     * Task title.
     */
    @Field(
        () => String,
        {
            description: "Task title.",
        },
    )
    @Column({
        name: "title",
        type: "varchar",
        length: 500,
        default: "",
    })
        title: string

    /**
     * Task description.
     */
    @Field(
        () => String,
        {
            description: "Task description.",
        },
    )
    @Column({
        name: "description",
        type: "text",
        default: "",
    })
        description: string

    /**
     * Task hint.
     */
    @Field(
        () => String,
        {
            description: "Task hint.",
        },
    )
    @Column({
        name: "hint",
        type: "text",
        default: "",
    })
        hint: string

    /**
     * Display order within the milestone's task list.
     */
    @Field(
        () => Int,
        {
            description: "Display order within the milestone's task list.",
        },
    )
    @Column({
        name: "order_index",
        type: "int",
        default: 0,
    })
        orderIndex: number

    /**
     * Priority weight — lower values are higher priority.
     */
    @Field(
        () => Int,
        {
            description: "Priority weight — lower values are higher priority.",
        },
    )
    @Column({
        name: "weight",
        type: "int",
        default: 0,
    })
        weight: number

    /**
     * Task type classification (design, techIntegrate, business).
     */
    @Field(
        () => GraphQLTypePersonalProjectTaskType,
        {
            description: "Task type classification.",
        },
    )
    @Column({
        name: "type",
        type: "enum",
        enum: PersonalProjectTaskType,
        enumName: "personal_project_task_type",
        default: PersonalProjectTaskType.Business,
    })
        type: PersonalProjectTaskType

    /**
     * Maximum possible score for this task (sum of all criteria scores).
     */
    @Field(
        () => Int,
        {
            description: "Maximum possible score for this task.",
        },
    )
    @Column({
        name: "max_score",
        type: "int",
        default: 0,
    })
        maxScore: number

    /**
     * Default locale for this task.
     */
    @Field(
        () => GraphQLTypeLocale,
        {
            description: "Default locale for this task.",
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
     * Milestone this task belongs to.
     */
    @Field(
        () => MilestoneEntity,
        {
            description: "Milestone this task belongs to.",
        },
    )
    @ManyToOne(
        () => MilestoneEntity,
        (milestone: MilestoneEntity) => milestone.tasks,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "milestone_id",
        foreignKeyConstraintName:
            "fk_milestone_id_milestone_tasks_milestones",
    })
        milestone: MilestoneEntity

    @Field(
        () => ID,
        {
            description: "Parent milestone ID.",
        },
    )
    @RelationId(
        (t: MilestoneTaskEntity) => t.milestone,
    )
        milestoneId: string

    /**
     * Localized translations of task fields (title, description).
     */
    @Field(
        () => [MilestoneTaskTranslationEntity],
        {
            description: "Localized translations of task fields.",
        },
    )
    @OneToMany(
        () => MilestoneTaskTranslationEntity,
        (translation: MilestoneTaskTranslationEntity) => translation.milestoneTask,
        {
            cascade: true,
        },
    )
        translations: Array<MilestoneTaskTranslationEntity>

    /**
     * Criteria belonging to this task.
     */
    @Field(
        () => [MilestoneTaskCriteriaEntity],
        {
            description: "Criteria belonging to this task.",
        },
    )
    @OneToMany(
        () => MilestoneTaskCriteriaEntity,
        (criteria: MilestoneTaskCriteriaEntity) => criteria.milestoneTask,
        {
            cascade: true,
        },
    )
        criteria: Array<MilestoneTaskCriteriaEntity>
}
