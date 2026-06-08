import {
    Field,
    ID,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    GraphQLJSON,
} from "graphql-type-json"
import {
    GraphQLTypeLocale,
    Locale,
} from "../enums"
import {
    Column,
    Entity,
    JoinColumn,
    ManyToMany,
    ManyToOne,
    OneToMany,
    RelationId,
} from "typeorm"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    ModuleEntity,
} from "./module.entity"
import {
    ContentTranslationEntity,
} from "./content-translation.entity"
import {
    ContentReferenceEntity,
} from "./content-reference.entity"
import {
    ChallengeEntity,
} from "./challenge.entity"
import {
    CodeExplainingEntity,
} from "./code-explaining.entity"
import {
    CodeImplementationEntity,
} from "./code-implementation.entity"
import {
    ContentBodyEntity,
} from "./content-body.entity"
import {
    ContentLearningOutcomeEntity,
} from "./content-learning-outcome.entity"
import {
    QuizDeckEntity,
} from "./quiz-deck.entity"

/**
 * Content attached to a module (title, optional description, body).
 */
@ObjectType({
    description: "Content attached to a module (title, description, body).",
})
@Entity("contents")
export class ContentEntity extends UuidAbstractEntity {
    /**
     * Content title.
     */
    @Field(
        () => String,
        {
            description: "Content title.",
        },
    )
    @Column({
        name: "title",
        type: "varchar",
        length: 500,
    })
        title: string

    /**
     * Human-facing stable identifier from the mount folder (`{index}-{slug}` slug segment).
     */
    @Field(
        () => String,
        {
            description: "Human-facing stable identifier from the content mount folder slug.",
        },
    )
    @Column({
        name: "display_id",
        type: "varchar",
        length: 255,
    })
        displayId: string

    /**
     * Optional short summary shown before the body (plain text or light markdown).
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Optional short summary shown before the body.",
        },
    )
    @Column({
        name: "description",
        type: "text",
        nullable: true,
    })
        description: string | null

    /**
     * Optional markdown body.
     */
    @Field(
        () => String,
        {
            description: "Markdown body content.",
        },
    )
    @Column({
        name: "body",
        type: "text",
    })
        body: string

    /**
     * Display order within the module content list.
     */
    @Field(
        () => Int,
        {
            description: "Display order within the module content list.",
        },
    )
    @Column({
        name: "order_index",
        type: "int",
        default: 0,
    })
        orderIndex: number

    /**
     * Default locale for this content row.
     */
    @Field(
        () => GraphQLTypeLocale,
        {
            description: "Default locale for this content row.",
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
     * Parent module this content belongs to.
     */
    @Field(
        () => ModuleEntity,
        {
            description: "Parent module this content belongs to.",
        },
    )
    @ManyToOne(
        () => ModuleEntity,
        (module: ModuleEntity) => module.contents,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "module_id",
        foreignKeyConstraintName: "fk_module_id_contents_modules",
    })
        module: ModuleEntity

    @Field(
        () => ID,
        {
            description: "Parent module ID.",
        },
    )
    @RelationId(
        (c: ContentEntity) => c.module,
    )
        moduleId: string

    /**
     * Estimated minutes to read content text content (articles, docs, etc.).
     */
    @Field(
        () => Int,
        {
            description: "Estimated minutes to read content text content.",
        },
    )
    @Column({
        name: "minutes_read",
        type: "int",
        default: 0,
    })
        minutesRead: number

    /**
     * Day this content was verified/audited. Presence (non-null) marks SCHEMA V2 content; legacy
     * content leaves it null. Sourced from the `# verified` markdown heading.
     */
    @Field(
        () => Date,
        {
            nullable: true,
            description: "Day this content was verified; non-null marks SCHEMA V2 content.",
        },
    )
    @Column({
        name: "verified",
        type: "timestamptz",
        nullable: true,
    })
        verified: Date | null

    /**
     * Localized translations for fields such as `title` and `body`.
     */
    @Field(
        () => [ContentTranslationEntity],
        {
            description: "Localized overrides for content fields (e.g. title, description, body).",
        },
    )
    @OneToMany(
        () => ContentTranslationEntity,
        (contentTranslation: ContentTranslationEntity) => contentTranslation.content,
        {
            cascade: true,
            orphanedRowAction: "delete",
        },
    )
        translations: Array<ContentTranslationEntity>

    /**
     * External URL references (docs, repos, etc.).
     */
    @Field(
        () => [ContentReferenceEntity],
        {
            description: "External URL references linked to this content.",
        },
    )
    @OneToMany(
        () => ContentReferenceEntity,
        (reference: ContentReferenceEntity) => reference.content,
        {
            cascade: true,
        },
    )
        references: Array<ContentReferenceEntity>

    /**
     * Challenges derived from this content.
     */
    @Field(
        () => [ChallengeEntity],
        {
            nullable: true,
            description: "Challenges associated with this content.",
        },
    )
    @OneToMany(
        () => ChallengeEntity,
        (challenge: ChallengeEntity) => challenge.content,
        {
            cascade: true,
        },
    )
        challenges: Array<ChallengeEntity>

    /**
     * Interview-prep quiz decks linked to this content (many-to-many; a deck
     * is owned by a course and may be linked to several contents).
     */
    @Field(
        () => [QuizDeckEntity],
        {
            nullable: true,
            description: "Quiz decks linked to this content (many-to-many).",
        },
    )
    @ManyToMany(
        () => QuizDeckEntity,
        (deck: QuizDeckEntity) => deck.contents,
    )
        quizDecks: Array<QuizDeckEntity>

    /**
     * Critical code snippets with explanations and multi-language implementations.
     */
    @Field(
        () => [CodeExplainingEntity],
        {
            nullable: true,
            description: "Critical code snippets with explanations (mount `# codeExplaining`).",
        },
    )
    @OneToMany(
        () => CodeExplainingEntity,
        (codeExplaining: CodeExplainingEntity) => codeExplaining.content,
        {
            cascade: true,
        },
    )
        codeExplainings: Array<CodeExplainingEntity>

    /**
     * Multi-language implementation guides (mount `# codeImplementations`).
     */
    @Field(
        () => [CodeImplementationEntity],
        {
            nullable: true,
            description: "Alternative-language implementation guides for this lesson.",
        },
    )
    @OneToMany(
        () => CodeImplementationEntity,
        (implementation: CodeImplementationEntity) => implementation.content,
        {
            cascade: true,
        },
    )
        codeImplementations: Array<CodeImplementationEntity>

    /**
     * SCHEMA V2 per-language lesson bodies (mount `bodies/<N>-<lang>/`). The scalar `body` stays
     * empty for SCHEMA V2 content; lesson markdown lives in these buckets.
     */
    @Field(
        () => [ContentBodyEntity],
        {
            nullable: true,
            description: "Per-language lesson bodies for this content (SCHEMA V2).",
        },
    )
    @OneToMany(
        () => ContentBodyEntity,
        (contentBody: ContentBodyEntity) => contentBody.content,
        {
            cascade: true,
            orphanedRowAction: "delete",
        },
    )
        bodies: Array<ContentBodyEntity>

    /**
     * Ordered "what you will learn" outcome bullets (mount `# whatYouLearn`). Shown on the lesson
     * header / landing.
     */
    @Field(
        () => [ContentLearningOutcomeEntity],
        {
            nullable: true,
            description: "Ordered 'what you will learn' outcome bullets for this content.",
        },
    )
    @OneToMany(
        () => ContentLearningOutcomeEntity,
        (learningOutcome: ContentLearningOutcomeEntity) => learningOutcome.content,
        {
            cascade: true,
        },
    )
        learningOutcomes: Array<ContentLearningOutcomeEntity>

    @Column({
        name: "num_challenges",
        type: "int",
        default: 0,
    })
        numChallenges: number

    /**
     * Whether this content requires enrollment (premium content).
     * Non-premium content is freely accessible and shareable.
     */
    @Field(
        () => Boolean,
        {
            nullable: true,
            defaultValue: false,
            description: "Whether this content requires enrollment (premium). Non-premium content is freely shareable.",
        },
    )
    @Column({
        name: "is_premium",
        type: "boolean",
        default: false,
    })
        isPremium: boolean

    /**
     * Whether the "Bài giảng" tab renders a live Sandpack sandbox alongside the code explaining list.
     * Set `# isSandbox` to `true` in the mount file for React/TSX lessons that should be interactive.
     */
    @Field(
        () => Boolean,
        {
            nullable: true,
            defaultValue: false,
            description: "When true, the lecture tab shows a live Sandpack sandbox for React/TSX lessons.",
        },
    )
    @Column({
        name: "is_sandbox",
        type: "boolean",
        default: false,
    })
        isSandbox: boolean

    /**
     * Captured Playwright E2E flows for this lesson (read-only test proof shown in
     * the lecture "E2E" tab). Populated by the seeder from the lesson's `e2e.json`:
     * each flow has id/title/description/lang/status/durationMs/logs. Stored as
     * jsonb and exposed as a JSON scalar so the shape can evolve without migrations.
     */
    @Field(() => GraphQLJSON, {
        nullable: true,
        description: "Captured E2E test flows (title/status/durationMs/logs) for the lesson's E2E proof tab.",
    })
    @Column({
        name: "e2e_flows",
        type: "jsonb",
        nullable: true,
    })
        e2eFlows: Array<Record<string, unknown>> | null

    /**
     * Base GitHub repo URL for the lesson sandbox source.
     * Example: `https://github.com/StarCi-Academy/fullstack-mastery-module-5-server-state-with-tanstack-query`
     */
    @Field(() => String,
        {
            nullable: true, description: "Base GitHub repo URL for the sandbox source." 
        })
    @Column({
        name: "github_base_url", type: "varchar", length: 512, nullable: true 
    })
        githubBaseUrl: string | null

    /**
     * Subdirectory path within the repo pointing to the lesson's frontend source.
     * Example: `1-mutations-and-invalidation-graph/frontend`
     */
    @Field(() => String,
        {
            nullable: true, description: "Subdirectory path within the repo for this lesson's frontend." 
        })
    @Column({
        name: "github_dir", type: "varchar", length: 512, nullable: true 
    })
        githubDir: string | null

    /**
     * Relative path to the hosted mock API for this lesson's sandbox.
     * Example: `/mocks/4-server-state-with-tanstack-query/0-usequery-and-cache-lifecycle`
     * The frontend prepends `NEXT_PUBLIC_MOCK_API_BASE_URL` to construct the full URL.
     */
    @Field(() => String,
        {
            nullable: true, description: "Relative path to the hosted mock API for this lesson's Sandpack sandbox." 
        })
    @Column({
        name: "backend_url", type: "varchar", length: 512, nullable: true 
    })
        backendUrl: string | null
}