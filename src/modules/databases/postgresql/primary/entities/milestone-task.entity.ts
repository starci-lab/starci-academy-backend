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
    MilestoneEntity,
} from "./milestone.entity"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    MilestoneTaskPassCriteriaEntity,
} from "./milestone-task-pass-criteria.entity"

/**
 * A task belonging to a milestone (e.g. "Xác định bài toán").
 */
@ObjectType({
    description: "A task belonging to a milestone.",
})
@Entity("milestone_tasks")
export class MilestoneTaskEntity extends UuidAbstractEntity {
    /**
     * Human-readable task title.
     */
    @Field(
        () => String,
        {
            description: "Human-readable task title.",
        },
    )
    @Column({
        name: "title",
        type: "varchar",
        length: 500,
    })
        title: string

    /**
     * Detailed description of the task.
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Detailed description of the task.",
        },
    )
    @Column({
        name: "description",
        type: "text",
        nullable: true,
    })
        description: string | null

    /**
     * Display order within the milestone task list.
     */
    @Field(
        () => Int,
        {
            description: "Display order within the milestone task list.",
        },
    )
    @Column({
        name: "order_index",
        type: "int",
        default: 0,
    })
        orderIndex: number

    /**
     * Default locale for the task.
     */
    @Field(
        () => GraphQLTypeLocale,
        {
            description: "Default locale for this task row.",
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
     * Ordered pass criteria belonging to this task.
     */
    @Field(
        () => [MilestoneTaskPassCriteriaEntity],
        {
            description: "Ordered pass criteria for this milestone task.",
        },
    )
    @OneToMany(
        () => MilestoneTaskPassCriteriaEntity,
        (criteria: MilestoneTaskPassCriteriaEntity) => criteria.milestoneTask,
        {
            cascade: true,
        },
    )
        passCriteria: Array<MilestoneTaskPassCriteriaEntity>
}
