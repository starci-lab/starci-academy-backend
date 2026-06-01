import {
    AiModelCategory,
    AiSubTier,
} from "@modules/databases"

import {
    DEFAULT_AI_AUTO_USES_PER_5H,
    DEFAULT_AI_AUTO_USES_PER_WEEK,
} from "@modules/filesystem"

/**
 * Free **Auto** allowance — counted in "lượt" (uses), not credits.
 * Runtime caps come from `systemConfig.ai.auto` in `app.yaml`
 * ({@link AiAutoQuotaConfigService}); these are legacy defaults only.
 */
export const AUTO_LIMIT_5H = DEFAULT_AI_AUTO_USES_PER_5H
export const AUTO_LIMIT_WEEK = DEFAULT_AI_AUTO_USES_PER_WEEK

/**
 * Credit cost of a single LLM call by model category (Premium mode).
 * Economy is the cheapest; Premium flagship models cost the most.
 */
export const CATEGORY_CREDIT_COST: Record<AiModelCategory, number> = {
    [AiModelCategory.Economy]: 1,
    [AiModelCategory.Balanced]: 3,
    [AiModelCategory.Premium]: 10,
}

/** Length of the short rolling window: 5 hours, in milliseconds. */
export const WINDOW_5H_MS = 5 * 60 * 60 * 1000

/** Length of the long rolling window: 7 days, in milliseconds. */
export const WINDOW_WEEK_MS = 7 * 24 * 60 * 60 * 1000

/** Billing period a single paid purchase grants, in months. */
export const SUBSCRIPTION_PERIOD_MONTHS = 1

/**
 * Categories unlocked by each entitlement.
 *
 * Any paid tier (Plus / Pro / Max) may invoke **every** category — credit cost
 * (see {@link CATEGORY_CREDIT_COST}) is the only limiter, so a Plus user can
 * still call a Premium model, it just burns more credits.
 *
 * `free` (no paid tier) is the Auto lane: it does not gate by category at all —
 * eligibility is decided per-model by the model's `complimentary` flag, not by
 * this map. The `free` entry is kept only so callers can render the lane.
 */
export const TIER_ALLOWED_CATEGORIES: Record<AiSubTier | "free", Array<AiModelCategory>> = {
    free: [
        AiModelCategory.Economy,
        AiModelCategory.Balanced,
        AiModelCategory.Premium,
    ],
    [AiSubTier.Plus]: [
        AiModelCategory.Economy,
        AiModelCategory.Balanced,
        AiModelCategory.Premium,
    ],
    [AiSubTier.Pro]: [
        AiModelCategory.Economy,
        AiModelCategory.Balanced,
        AiModelCategory.Premium,
    ],
    [AiSubTier.Max]: [
        AiModelCategory.Economy,
        AiModelCategory.Balanced,
        AiModelCategory.Premium,
    ],
}
