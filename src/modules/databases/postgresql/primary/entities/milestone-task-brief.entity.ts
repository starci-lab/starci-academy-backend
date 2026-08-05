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
    MilestoneTaskBriefTranslationEntity,
} from "./milestone-task-brief-translation.entity"

@ObjectType({
    description: "Per-language learner-facing brief for a milestone task.",
})
@Entity("milestone_task_briefs")
/**
 * SCHEMA V2 per-language task brief (the learner-facing "what to build" for one programming
 * language, Markdown with `:::muted` callouts). Separate from the grading criteria; this IS exposed
 * via GraphQL for the FE to render. Translatable (locale lives in translations).
 */
export class MilestoneTaskBriefEntity extends UuidAbstractEntity {
    /**
     * Programming language of this brief (typescript/java/csharp/go, or `agnostic`).
     */
    @Field(
        () => String,
        {
            description: "Programming language of this brief (or `agnostic`).",
        },
    )
    @Column({
        name: "lang",
        type: "varchar",
        length: 64,
    })
        lang: string

    /**
     * Learner-facing task brief for this language (Markdown).
     */
    @Field(
        () => String,
        {
            description: "Learner-facing task brief for this language (Markdown).",
        },
    )
    @Column({
        name: "body",
        type: "text",
    })
        body: string

    /**
     * Display order within the task's brief list.
     */
    @Field(
        () => Int,
        {
            description: "Display order within the task's brief list.",
        },
    )
    @Column({
        name: "order_index",
        type: "int",
        default: 0,
    })
        orderIndex: number

    /**
     * Pure ordering index used to reorder the list (decoupled from orderIndex).
     */
    @Field(
        () => Int,
        {
            description: "Pure ordering index used to reorder the list (decoupled from orderIndex).",
        },
    )
    @Column({
        name: "sort_index",
        type: "int",
        default: 0,
    })
        sortIndex: number

    /**
     * Default locale for this brief body.
     */
    @Field(
        () => GraphQLTypeLocale,
        {
            description: "Default locale for this brief body.",
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
     * Milestone task this brief belongs to.
     */
    @Field(
        () => MilestoneTaskEntity,
        {
            description: "Milestone task this brief belongs to.",
        },
    )
    @ManyToOne(
        () => MilestoneTaskEntity,
        (milestoneTask: MilestoneTaskEntity) => milestoneTask.briefs,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "milestone_task_id",
        foreignKeyConstraintName: "fk_mtask_briefs_mtask",
    })
        milestoneTask: MilestoneTaskEntity

    @Field(
        () => ID,
        {
            description: "Parent milestone task ID.",
        },
    )
    @RelationId(
        (brief: MilestoneTaskBriefEntity) => brief.milestoneTask,
    )
        milestoneTaskId: string

    /**
     * Localized overrides for the brief `body`.
     */
    @Field(
        () => [MilestoneTaskBriefTranslationEntity],
        {
            description: "Localized overrides for the brief body.",
        },
    )
    @OneToMany(
        () => MilestoneTaskBriefTranslationEntity,
        (translation: MilestoneTaskBriefTranslationEntity) => translation.milestoneTaskBrief,
        {
            cascade: true,
        },
    )
        translations: Array<MilestoneTaskBriefTranslationEntity>
}
