import type {
    AppConfigAiModel,
    AppConfigProSubscription,
} from "@modules/filesystem/types/config"

/**
 * Mount markdown shape for `.mount/data/ai-models/<index>-<slug>/{en,vi}.md`.
 *
 * Index signature satisfies the `Record<string, unknown>` constraint of
 * `ExtractJsonFromMdService.extract<T>()` (a plain interface would not).
 */
export type AiModelCatalogMd = {
    /** Display name of the model. */
    name?: string
    /** Provider key (coerced to `ModelProvider`). */
    provider?: string
    /** Category key (coerced to `AiModelCategory`). */
    category?: string
    /** Mount file path holding the provider API keys. */
    keysFilePath?: string
    /** Rotation priority (higher = preferred); string or number from markdown. */
    priority?: string | number
    /** Credit cost (billing, integer); string or number from markdown. */
    credit?: string | number
    /** Within-category order weight (decimals allowed); string or number from markdown. */
    weight?: string | number
    /** Real provider price (USD) per 1,000,000 input tokens; string or number from markdown. */
    priceInUsdPerMTok?: string | number
    /** Real provider price (USD) per 1,000,000 output tokens; string or number from markdown. */
    priceOutUsdPerMTok?: string | number
    /** Published context window in tokens; string or number from markdown. */
    contextWindowTokens?: string | number
    /** USD per 1,000,000 cached input tokens; string or number from markdown. */
    priceCacheReadUsdPerMTok?: string | number
    /** Whether the model is enabled; string or boolean from markdown. */
    enabled?: string | boolean
    /** Whether the model is complimentary (free); string or boolean from markdown. */
    complimentary?: string | boolean
    /** Comma/newline-separated task list this model is suited for (chatting, grading). */
    supportedTasks?: string
    /** Localized catalog label. */
    label?: string
    /** Localized catalog description. */
    description?: string
    /** Any additional mount fields (index signature for the extractor constraint). */
    [key: string]: unknown
}

/** Localized catalog text (label, description) for a single locale. */
export interface AiModelCatalogTranslation {
    /** Localized catalog label shown to users. */
    label: string
    /** Localized catalog description shown to users. */
    description: string
}

/** A parsed model row together with its bilingual catalog text. */
export interface AiModelCatalogParsed {
    /** Runtime catalog row (feeds appConfig + key rotation). */
    model: AppConfigAiModel
    /** English catalog text from `en.md`. */
    en: AiModelCatalogTranslation
    /** Vietnamese catalog text from `vi.md` (falls back to English). */
    vi: AiModelCatalogTranslation
}

/** Mount markdown shape for `.mount/data/subcriptions/<index>-<tier>/en.md`. */
export type SubscriptionCatalogMd = {
    /** Tier key (coerced to `AiSubTier`). */
    tier?: string
    /** Optional human-friendly tier display name. */
    displayName?: string
    /** Short audience/purpose tagline shown on the tier card. */
    description?: string
    /** Price in VND; string or number from markdown. */
    priceVnd?: string | number
    /** Price in USD (dollars) for international gateways; string or number from markdown. */
    priceUsd?: string | number
    /** Credits granted per 5-hour window; string or number from markdown. */
    creditsPer5h?: string | number
    /** Credits granted per week; string or number from markdown. */
    creditsPerWeek?: string | number
    /** Whether the tier is flagged as popular; string or boolean from markdown. */
    popular?: string | boolean
    /** Whether the tier is enabled; string or boolean from markdown. */
    enabled?: string | boolean
    /** Any additional mount fields (index signature for the extractor constraint). */
    [key: string]: unknown
}

/** Mount markdown shape for `.mount/data/learner-plans/<index>-pro/en.md`. */
export type LearnerPlanCatalogMd = {
    planId?: string
    displayName?: string
    description?: string
    priceVnd?: string | number
    billingPeriodMonths?: string | number
    offerRevision?: string
    creditsPer5h?: string | number
    creditsPerWeek?: string | number
    enabled?: string | boolean
    [key: string]: unknown
}

/** Kept here so parser call sites share the exact runtime config contract. */
export type LearnerPlanCatalogRow = AppConfigProSubscription
