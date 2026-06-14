import type {
    AiModelCategory,
    ModelProvider,
    PricingPhase,
} from "@modules/databases"

/** payOS credentials stored in mounted {@link AppConfig} (see `.mount/config/app.yaml`). */
export interface AppConfigPayos {
    clientId: string
    checksumKey: string
}

/** `systemConfig.challenge` in mounted `app.yaml`. */
export interface AppConfigSystemChallenge {
    passThreshold: number
}

/** `systemConfig.task` in mounted `app.yaml`. */
export interface AppConfigSystemTask {
    passThreshold: number
}

/** `systemConfig.course` in mounted `app.yaml`. */
export interface AppConfigSystemCourse {
    /**
     * Pricing phase a course starts at when its `course_metadata` row is first
     * seeded (Pioneer already sold out → default EarlyBird). Only applied when
     * the metadata row is absent; an existing (possibly-advanced) phase is kept.
     */
    defaultPricingPhase: PricingPhase
}

import type {
    AppConfigSystemAi,
} from "./ai-auto-quota"

/** `systemConfig` in mounted `app.yaml`. */
export interface AppConfigSystemConfig {
    challenge: AppConfigSystemChallenge
    task: AppConfigSystemTask
    /** Optional Auto-lane quota caps (`systemConfig.ai.auto`). */
    ai?: AppConfigSystemAi
    /** Optional course defaults (`systemConfig.course`). */
    course?: AppConfigSystemCourse
}

/**
 * One AI-model row parsed from `.mount/data/ai-models/<index>-<slug>/en.md`.
 * The catalog seeder upserts each entry into the `ai_models` table; runtime
 * (`KeyStoreService` + `UseApiService`) reads back from DB, not from this shape.
 */
export interface AppConfigAiModel {
    /** Concrete model name accepted by the provider SDK (e.g. "gpt-4o-mini"). */
    name: string
    /** Provider that serves the model. */
    provider: ModelProvider
    /** Coarse cost/quality category — Economy / Balanced / Premium. */
    category: AiModelCategory
    /** Absolute / mount path to the newline-separated key file. */
    keysFilePath: string
    /** Fallback-chain priority. Higher = tried first by `UseApiService`. */
    priority: number
    /** Kill-switch — `false` removes the model from rotation without deleting the row. */
    enabled: boolean
    /** Usable on the free Auto lane — no subscription, debited by uses ("lượt"). */
    complimentary: boolean
}

/**
 * One AI subscription tier (`plus` | `pro` | `max`) in `app.yaml` under
 * `subscriptions.tiers`. Mount files live under `.mount/data/subcriptions/`.
 */
export interface AppConfigSubscriptionTier {
    /** Stable tier id — matches {@link AiSubTier} enum values. */
    tier: string
    /** UI label (optional; defaults to capitalized tier). */
    displayName?: string
    /** Short audience/purpose tagline shown on the tier card. */
    description: string
    /** Monthly price in VND. */
    priceVnd: number
    /** Monthly price in USD (dollars) for international gateways. */
    priceUsd: number
    /** Additive credits per 5-hour rolling window. */
    creditsPer5h: number
    /** Additive credits per weekly rolling window. */
    creditsPerWeek: number
    /** Highlight as “most popular” in checkout UI. */
    popular?: boolean
    /** Kill-switch — `false` hides tier without deleting config. */
    enabled: boolean
}

/** `subscriptions` section in mounted `app.yaml`. */
export interface AppConfigSubscriptions {
    tiers: Array<AppConfigSubscriptionTier>
}

/**
 * `membership` section in mounted `app.yaml` — the single community-membership
 * product ($5/month equivalent) plus the perks it controls.
 */
export interface AppConfigMembership {
    /** Monthly price in VND for domestic gateways (PayOS / Sepay). */
    priceVnd: number
    /** Monthly price in USD (dollars) for international gateways. */
    priceUsd: number
    /** Percent discount members get on course checkout (e.g. 20 = 20% off). */
    courseDiscountPercent: number
    /** Free membership months auto-granted when a user buys any course. */
    freeMonthsOnCoursePurchase: number
    /** Kill-switch — `false` hides membership purchase without deleting config. */
    enabled: boolean
}

/** Root app config. */
export interface AppConfig {
    sentryDsn: string
    /** Optional; when set, overrides {@link envConfig}.payos for client id and checksum key. */
    payos: AppConfigPayos
    /** Optional public/system tuning (see `.mount/config/app.yaml`). */
    systemConfig: AppConfigSystemConfig
    /** AI subscription tiers (Plus / Pro / Max). */
    subscriptions: AppConfigSubscriptions
    /** Community membership product + perks (blog/community/discount). */
    membership: AppConfigMembership
}
