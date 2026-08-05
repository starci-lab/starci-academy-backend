import {
    Field,
    Float,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    Column,
    Entity,
    Index,
    OneToMany,
} from "typeorm"
import {
    AiModelCategory,
    AiModelTask,
    GraphQLTypeAiModelCategory,
    GraphQLTypeAiModelTask,
    GraphQLTypeLocale,
    GraphQLTypeModelProvider,
    Locale,
    ModelProvider,
} from "../enums"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    AiModelTranslationEntity,
} from "./ai-model-translation.entity"

@ObjectType({
    description: "An AI model in the rotation catalog.",
})
@Index(
    "uq_ai_models_provider_name",
    ["provider",
        "name"],
    {
        unique: true,
    },
)
@Entity("ai_models")
/**
 * One AI model in the rotation catalog (seeded from `.mount/data/ai-models`).
 *
 * Mirrors `AppConfigAiModel` but persisted so the admin UI + model picker can
 * query it. Translatable fields (label, description) live in translations.
 * Upserted by `(provider, name)`.
 */
export class AiModelEntity extends UuidAbstractEntity {
    /** Concrete model name accepted by the provider SDK (e.g. "gpt-4o-mini"). */
    @Field(
        () => String,
        {
            description: "Concrete model name accepted by the provider SDK.",
        },
    )
    @Column({
        name: "name",
        type: "varchar",
        length: 128,
    })
        name: string

    /** Provider that serves the model. */
    @Field(
        () => GraphQLTypeModelProvider,
        {
            description: "Provider that serves the model.",
        },
    )
    @Column({
        name: "provider",
        type: "enum",
        enum: ModelProvider,
        enumName: "model_provider",
    })
        provider: ModelProvider

    /** Coarse cost/quality category -- economy / balanced / premium. */
    @Field(
        () => GraphQLTypeAiModelCategory,
        {
            description: "Coarse cost/quality category.",
        },
    )
    @Column({
        name: "category",
        type: "enum",
        enum: AiModelCategory,
        enumName: "ai_model_category",
    })
        category: AiModelCategory

    /** Mount path to the newline-separated key file for this model's pool. */
    @Field(
        () => String,
        {
            description: "Mount path to the newline-separated key file.",
        },
    )
    @Column({
        name: "keys_file_path",
        type: "varchar",
        length: 512,
        default: "",
    })
        keysFilePath: string

    /** Fallback-chain priority. Higher = tried first by the balancer. */
    @Field(
        () => Int,
        {
            description: "Fallback-chain priority (higher tried first).",
        },
    )
    @Column({
        name: "priority",
        type: "int",
        default: 0,
    })
        priority: number

    /**
     * Credit cost charged to the user when THIS model serves a grading run
     * (integer). Free models = 0. Sourced from the `# credit` markdown heading.
     * This is the BILLING value (distinct from {@link weight}).
     */
    @Field(
        () => Int,
        {
            description: "Credit cost charged per grading run (billing).",
        },
    )
    @Column({
        name: "credit",
        type: "int",
        default: 0,
    })
        credit: number

    /**
     * Within-category try-order key for the Auto lane (higher tried first, then
     * climb to the next category). Accepts decimals so models sharing a credit
     * tier still order distinctly (e.g. credit 5 -> weights 5.3 / 5.2 / 5.1).
     * Sourced from the `# weight` markdown heading. This is the ORDERING value
     * (distinct from {@link credit}).
     */
    @Field(
        () => Float,
        {
            description: "Within-category try-order key (higher first; decimals allowed).",
        },
    )
    @Column({
        name: "weight",
        type: "double precision",
        default: 0,
    })
        weight: number

    /**
     * REAL provider price in USD per 1,000,000 INPUT tokens (the true cost to
     * us). Source of truth for billing: {@link creditPerMTokIn} is DERIVED from
     * this at seed time (`round(price x credits-per-USD)`). Kept in the DB for
     * cost/margin auditing. Free / self-hosted models = 0.
     */
    @Field(
        () => Float,
        {
            description: "Real provider price (USD) per 1,000,000 input tokens — cost source of truth.",
        },
    )
    @Column({
        name: "price_in_usd_per_mtok",
        type: "double precision",
        default: 0,
    })
        priceInUsdPerMTok: number

    /** REAL provider price in USD per 1,000,000 OUTPUT tokens (cost source of truth). */
    @Field(
        () => Float,
        {
            description: "Real provider price (USD) per 1,000,000 output tokens — cost source of truth.",
        },
    )
    @Column({
        name: "price_out_usd_per_mtok",
        type: "double precision",
        default: 0,
    })
        priceOutUsdPerMTok: number

    /**
     * REAL provider price in USD per 1,000,000 CACHED input tokens -- a
     * prompt-cache hit, which providers re-price at roughly 0.1x-0.2x of a fresh
     * input token and OpenRouter passes through. Null when the model publishes
     * no cache pricing (billing then treats cached tokens as fresh).
     */
    @Field(
        () => Float,
        {
            nullable: true,
            description: "Real provider price (USD) per 1,000,000 cached input tokens; null when the model has no cache pricing.",
        },
    )
    @Column({
        name: "price_cache_read_usd_per_mtok",
        type: "double precision",
        nullable: true,
    })
        priceCacheReadUsdPerMTok: number | null

    /**
     * Credits charged per 1,000,000 CACHED input tokens. DERIVED from
     * {@link priceCacheReadUsdPerMTok}; null when the model has no cache price.
     */
    @Field(
        () => Int,
        {
            nullable: true,
            description: "Credits charged per 1,000,000 cached input tokens (derived from price).",
        },
    )
    @Column({
        name: "credit_per_mtok_cached",
        type: "int",
        nullable: true,
    })
        creditPerMTokCached: number | null

    /**
     * Total context window in tokens, as published by the provider. Together
     * with the two prices this is the whole recorded metric set the catalog
     * ranks on -- see `computeModelWeight`, where a roomier window and a cheaper
     * call both push a model earlier in its category's chain.
     *
     * Nullable on purpose: a window we have not verified stays `null` rather
     * than being guessed, and the ranking treats it as neutral.
     */
    @Field(
        () => Int,
        {
            nullable: true,
            description: "Published context window in tokens; null when not yet recorded.",
        },
    )
    @Column({
        name: "context_window_tokens",
        type: "int",
        nullable: true,
    })
        contextWindowTokens: number | null

    /**
     * Token-based billing rate: credits charged per 1,000,000 INPUT tokens.
     * DERIVED at seed from {@link priceInUsdPerMTok} (`round(price x 5000)`, i.e.
     * 1 credit ≡ $0.0002 real cost). A grading run is billed
     * `ceil((promptTok-in + completionTok-out)/1e6)`; {@link credit} is the flat
     * FALLBACK used only when token usage is unreported.
     */
    @Field(
        () => Int,
        {
            description: "Credits charged per 1,000,000 input tokens (derived from price).",
        },
    )
    @Column({
        name: "credit_per_mtok_in",
        type: "int",
        default: 0,
    })
        creditPerMTokIn: number

    /** Token-based billing rate: credits charged per 1,000,000 OUTPUT tokens. */
    @Field(
        () => Int,
        {
            description: "Credits charged per 1,000,000 output tokens (token-based billing).",
        },
    )
    @Column({
        name: "credit_per_mtok_out",
        type: "int",
        default: 0,
    })
        creditPerMTokOut: number

    /** Kill-switch -- `false` removes the model from rotation without deleting. */
    @Field(
        () => Boolean,
        {
            description: "Whether the model is active in rotation.",
        },
    )
    @Column({
        name: "enabled",
        type: "boolean",
        default: true,
    })
        enabled: boolean

    /** Usable on the free Auto lane -- no subscription, debited by uses. */
    @Field(
        () => Boolean,
        {
            description: "Whether the model is usable on the free Auto lane.",
        },
    )
    @Column({
        name: "complimentary",
        type: "boolean",
        default: false,
    })
        complimentary: boolean

    /**
     * Tasks this model is suited for (`chatting` / `grading`). JSONB array of
     * {@link AiModelTask} string values (NOT a Postgres enum) -- drives FE picker
     * visibility (a grading-only model is hidden from the chat picker, etc.).
     */
    @Field(
        () => [GraphQLTypeAiModelTask],
        {
            description: "Tasks this model is suited for (chatting / grading).",
        },
    )
    @Column({
        name: "supported_tasks",
        type: "jsonb",
        default: () => "'[]'",
    })
        supportedTasks: Array<AiModelTask>

    /** Default locale for this model's catalog text. */
    @Field(
        () => GraphQLTypeLocale,
        {
            description: "Default locale for this model's catalog text.",
        },
    )
    @Column({
        name: "default_locale",
        type: "enum",
        enum: Locale,
        enumName: "locale",
        default: Locale.En,
    })
        defaultLocale: Locale

    /** Localized translations of catalog fields (label, description). */
    @Field(
        () => [AiModelTranslationEntity],
        {
            description: "Localized translations of catalog fields.",
        },
    )
    @OneToMany(
        () => AiModelTranslationEntity,
        (translation: AiModelTranslationEntity) => translation.aiModel,
        {
            cascade: true,
        },
    )
        translations: Array<AiModelTranslationEntity>
}
