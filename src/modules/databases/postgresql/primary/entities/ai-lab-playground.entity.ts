import {
    Field,
    ID,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    OneToMany,
    RelationId,
} from "typeorm"
import {
    AiLabPlaygroundKind,
    GraphQLTypeAiLabPlaygroundKind,
    GraphQLTypeLocale,
    GraphQLTypeModelProvider,
    Locale,
    ModelProvider,
} from "../enums"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    ContentEntity,
} from "./content.entity"
import {
    AiLabPlaygroundTranslationEntity,
} from "./ai-lab-playground-translation.entity"
import {
    AiLabRunParamsObject,
} from "./ai-lab-run-params.object"

/**
 * One AI Lab playground attached to a lesson content. Defines the prompt
 * sandbox (or RAG / comparison surface) a learner sees on that lesson: the
 * default prompts, sampling params, allowed providers, and run budget.
 * Localized labels live in a translation table; seeded from `.mount` markdown.
 */
@ObjectType({
    description: "AI Lab playground attached to a lesson content (prompt / RAG / comparison sandbox).",
})
@Index(["content"])
@Entity("ai_lab_playgrounds")
export class AiLabPlaygroundEntity extends UuidAbstractEntity {
    /**
     * Lesson content this playground is attached to.
     */
    @Field(
        () => ContentEntity,
        {
            description: "Lesson content this playground is attached to.",
        },
    )
    @ManyToOne(
        () => ContentEntity,
        {
            onDelete: "CASCADE",
            nullable: false,
        },
    )
    @JoinColumn({
        name: "content_id",
        foreignKeyConstraintName: "fk_content_id_ai_lab_playgrounds_contents",
    })
        content: ContentEntity

    /**
     * Owning content ID.
     */
    @Field(
        () => ID,
        {
            description: "Owning content ID.",
        },
    )
    @RelationId(
        (playground: AiLabPlaygroundEntity) => playground.content,
    )
        contentId: string

    /**
     * Human-facing stable identifier from the playground mount folder slug.
     */
    @Field(
        () => String,
        {
            description: "Human-facing stable identifier from the playground mount folder slug.",
        },
    )
    @Column({
        name: "slug",
        type: "varchar",
        length: 255,
    })
        slug: string

    /**
     * The kind of playground (prompt / rag / comparison).
     */
    @Field(
        () => GraphQLTypeAiLabPlaygroundKind,
        {
            description: "The kind of playground (prompt / rag / comparison).",
        },
    )
    @Column({
        name: "kind",
        type: "enum",
        enum: AiLabPlaygroundKind,
        enumName: "ai_lab_playground_kind",
    })
        kind: AiLabPlaygroundKind

    /**
     * Default system prompt seeded into the playground (nullable).
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Default system prompt seeded into the playground.",
        },
    )
    @Column({
        name: "default_system_prompt",
        type: "text",
        nullable: true,
    })
        defaultSystemPrompt: string | null

    /**
     * Default user prompt seeded into the playground (nullable).
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Default user prompt seeded into the playground.",
        },
    )
    @Column({
        name: "default_user_prompt",
        type: "text",
        nullable: true,
    })
        defaultUserPrompt: string | null

    /**
     * Default sampling / generation parameters for runs in this playground.
     */
    @Field(
        () => AiLabRunParamsObject,
        {
            description: "Default sampling / generation parameters for runs in this playground.",
        },
    )
    @Column({
        name: "default_params",
        type: "jsonb",
    })
        defaultParams: AiLabRunParamsObject

    /**
     * Providers a learner may pick from in this playground.
     */
    @Field(
        () => [GraphQLTypeModelProvider],
        {
            description: "Providers a learner may pick from in this playground.",
        },
    )
    @Column({
        name: "allowed_providers",
        type: "jsonb",
    })
        allowedProviders: Array<ModelProvider>

    /**
     * Maximum number of runs allowed per rate-limit window (0 = unlimited).
     */
    @Field(
        () => Int,
        {
            description: "Maximum number of runs allowed per rate-limit window (0 = unlimited).",
        },
    )
    @Column({
        name: "max_runs_per_window",
        type: "int",
        default: 0,
    })
        maxRunsPerWindow: number

    /**
     * Qdrant collection slug backing a RAG playground (nullable for non-RAG kinds).
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Qdrant collection slug backing a RAG playground.",
        },
    )
    @Column({
        name: "rag_collection_slug",
        type: "varchar",
        nullable: true,
    })
        ragCollectionSlug: string | null

    /**
     * Default locale for this playground row.
     */
    @Field(
        () => GraphQLTypeLocale,
        {
            description: "Default locale for this playground row.",
        },
    )
    @Column({
        name: "locale",
        type: "enum",
        enum: Locale,
        enumName: "locale",
    })
        defaultLocale: Locale

    /**
     * Localized overrides for playground fields (label, description).
     */
    @Field(
        () => [AiLabPlaygroundTranslationEntity],
        {
            description: "Localized overrides for playground fields (label, description).",
        },
    )
    @OneToMany(
        () => AiLabPlaygroundTranslationEntity,
        (translation: AiLabPlaygroundTranslationEntity) => translation.playground,
        {
            cascade: true,
        },
    )
        translations: Array<AiLabPlaygroundTranslationEntity>
}
