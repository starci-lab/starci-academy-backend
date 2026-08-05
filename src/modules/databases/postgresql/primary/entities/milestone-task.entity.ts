import {
    Field,
    ID,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    ChallengeDifficulty,
    GraphQLTypeChallengeDifficulty,
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
import {
    MilestoneTaskCodeImplementationEntity,
} from "./milestone-task-code-implementation.entity"
import {
    MilestoneTaskOutcomeCriteriaEntity,
} from "./milestone-task-outcome-criteria.entity"
import {
    MilestoneTaskApproachCriteriaEntity,
} from "./milestone-task-approach-criteria.entity"
import {
    MilestoneTaskBriefEntity,
} from "./milestone-task-brief.entity"

@ObjectType({
    description: "A task belonging to a milestone.",
})
@Entity("milestone_tasks")
/**
 * A task belonging to a milestone.
 * Seeded from `.mount/data/courses/{course}/tasks/{milestone}/{task}/`.
 * Translatable fields (title, description) live in translations.
 */
export class MilestoneTaskEntity extends UuidAbstractEntity {
    /**
     * Human-facing stable identifier = the task mount folder slug (the numeric index
     * prefix is stripped, e.g. folder `0-clean-architecture-and-health` →
     * `clean-architecture-and-health`). Used as the secondary CDN object key alongside the id.
     */
    @Field(
        () => String,
        {
            description: "Human-facing stable identifier from the task mount folder slug.",
        },
    )
    @Column({
        name: "display_id",
        type: "varchar",
        length: 255,
        default: "",
    })
        displayId: string

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
     * Relative difficulty of this capstone task (easy / medium / hard / insane).
     * Drives the Auto grading lane's complexity routing — harder tasks pick a
     * stronger model category within the user's entitlement. Nullable when unset
     * (sourced from the `# difficulty` markdown heading); null → routed as medium.
     */
    @Field(
        () => GraphQLTypeChallengeDifficulty,
        {
            nullable: true,
            description: "Relative difficulty (drives Auto complexity routing).",
        },
    )
    @Column({
        name: "difficulty",
        type: "enum",
        enum: ChallengeDifficulty,
        enumName: "challenge_difficulty",
        nullable: true,
    })
        difficulty: ChallengeDifficulty | null

    /**
     * Day this task was verified. Presence (non-null) marks a SCHEMA V2 task graded by the
     * per-language outcome/approach criteria under `langBlocks`; legacy tasks leave it null and
     * grade by `criterias`. Sourced from the `# verified` markdown heading.
     */
    @Field(
        () => Date,
        {
            nullable: true,
            description: "Day this task was verified; non-null marks a SCHEMA V2 task.",
        },
    )
    @Column({
        name: "verified",
        type: "timestamptz",
        nullable: true,
    })
        verified: Date | null

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
        criterias: Array<MilestoneTaskCriteriaEntity>

    /**
     * Multi-language implementation guides for this task.
     */
    @Field(
        () => [MilestoneTaskCodeImplementationEntity],
        {
            description: "Multi-language implementation guides for this task.",
        },
    )
    @OneToMany(
        () => MilestoneTaskCodeImplementationEntity,
        (implementation: MilestoneTaskCodeImplementationEntity) => implementation.milestoneTask,
        {
            cascade: true,
        },
    )
        codeImplementations: Array<MilestoneTaskCodeImplementationEntity>

    /**
     * SCHEMA V2 per-language learner-facing briefs (the "what to build" for each language).
     * Present on V2 tasks (non-null `verified`); exposed to GraphQL for the FE to render.
     */
    @Field(
        () => [MilestoneTaskBriefEntity],
        {
            description: "SCHEMA V2 per-language learner-facing task briefs.",
        },
    )
    @OneToMany(
        () => MilestoneTaskBriefEntity,
        (brief: MilestoneTaskBriefEntity) => brief.milestoneTask,
        {
            cascade: true,
        },
    )
        briefs: Array<MilestoneTaskBriefEntity>

    /**
     * SCHEMA V2 outcome grading criteria (observable yes/no items). INTERNAL grading rubric —
     * deliberately NOT a `@Field`, so it is never exposed through GraphQL to the learner.
     */
    @OneToMany(
        () => MilestoneTaskOutcomeCriteriaEntity,
        (criteria: MilestoneTaskOutcomeCriteriaEntity) => criteria.milestoneTask,
        {
            cascade: true,
        },
    )
        outcomeCriteria: Array<MilestoneTaskOutcomeCriteriaEntity>

    /**
     * SCHEMA V2 approach grading criteria (per-language yes/no items). INTERNAL grading rubric —
     * NOT a `@Field`.
     */
    @OneToMany(
        () => MilestoneTaskApproachCriteriaEntity,
        (criteria: MilestoneTaskApproachCriteriaEntity) => criteria.milestoneTask,
        {
            cascade: true,
        },
    )
        approachCriteria: Array<MilestoneTaskApproachCriteriaEntity>

    /**
     * The content-AI conversation the learner last used on this task's surface,
     * so the FE can resume the remembered chat instead of starting a fresh one.
     * Nullable — set once a `content-ai session` (scope = `task`) exists for this
     * task; never set at seed time.
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "The content-AI conversation the learner last used on this task (for resume); null until one exists.",
        },
    )
    @Column({
        name: "content_ai_session_id",
        type: "uuid",
        nullable: true,
    })
        contentAiSessionId: string | null
}
