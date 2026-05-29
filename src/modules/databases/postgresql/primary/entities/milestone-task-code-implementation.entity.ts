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
    MilestoneTaskCodeImplementationTranslationEntity,
} from "./milestone-task-code-implementation-translation.entity"

/**
 * Multi-language implementation guide for a milestone task (mount `# codeImplementations`).
 * Translatable fields (guide, example) live in translations.
 */
@ObjectType({
    description: "Implementation guide for a milestone task in a specific programming language.",
})
@Entity("milestone_task_code_implementations")
export class MilestoneTaskCodeImplementationEntity extends UuidAbstractEntity {
    /**
     * Programming language (e.g. typescript, go, csharp, java).
     */
    @Field(
        () => String,
        {
            description: "Programming language (e.g. typescript, go, csharp, java).",
        },
    )
    @Column({
        name: "lang",
        type: "varchar",
        length: 64,
    })
        lang: string

    /**
     * Mapping guide prose (Markdown).
     */
    @Field(
        () => String,
        {
            description: "Mapping guide prose (Markdown).",
        },
    )
    @Column({
        name: "guide",
        type: "text",
    })
        guide: string

    /**
     * Example code block (Markdown).
     */
    @Field(
        () => String,
        {
            description: "Example code block (Markdown).",
        },
    )
    @Column({
        name: "example",
        type: "text",
    })
        example: string

    /**
     * Display order within the task implementation list.
     */
    @Field(
        () => Int,
        {
            description: "Display order within the task implementation list.",
        },
    )
    @Column({
        name: "order_index",
        type: "int",
        default: 0,
    })
        orderIndex: number

    /**
     * Default locale for this implementation row.
     */
    @Field(
        () => GraphQLTypeLocale,
        {
            description: "Default locale for this implementation row.",
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
     * Milestone task this implementation belongs to.
     */
    @Field(
        () => MilestoneTaskEntity,
        {
            description: "Milestone task this implementation belongs to.",
        },
    )
    @ManyToOne(
        () => MilestoneTaskEntity,
        (milestoneTask: MilestoneTaskEntity) => milestoneTask.codeImplementations,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "milestone_task_id",
        foreignKeyConstraintName:
            "fk_mtask_id_mtask_code_impls_milestone_tasks",
    })
        milestoneTask: MilestoneTaskEntity

    @Field(
        () => ID,
        {
            description: "Parent milestone task ID.",
        },
    )
    @RelationId(
        (implementation: MilestoneTaskCodeImplementationEntity) => implementation.milestoneTask,
    )
        milestoneTaskId: string

    /**
     * Localized overrides for guide and example.
     */
    @Field(
        () => [MilestoneTaskCodeImplementationTranslationEntity],
        {
            description: "Localized overrides for guide and example.",
        },
    )
    @OneToMany(
        () => MilestoneTaskCodeImplementationTranslationEntity,
        (translation: MilestoneTaskCodeImplementationTranslationEntity) => translation.milestoneTaskCodeImplementation,
        {
            cascade: true,
        },
    )
        translations: Array<MilestoneTaskCodeImplementationTranslationEntity>
}
