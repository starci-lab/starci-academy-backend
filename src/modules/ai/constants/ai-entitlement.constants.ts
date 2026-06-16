import {
    AiModelCategory,
    AiSubTier,
} from "@modules/databases"

/**
 * Credit cost of a single LLM call by model category — unified with the grading
 * tiers (Low/Medium/High = 10/20/30 in `credit-cost.ts`).
 * Economy is the cheapest; Premium flagship models cost the most.
 */
export const CATEGORY_CREDIT_COST: Record<AiModelCategory, number> = {
    [AiModelCategory.Economy]: 10,
    [AiModelCategory.Balanced]: 20,
    [AiModelCategory.Premium]: 30,
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
 * `free` (no paid tier) is locked to **Economy** models only — the weak/auto
 * tier. Any paid tier (Plus / Pro / Max) unlocks **every** category (Balanced +
 * Premium on top); credit cost (see {@link CATEGORY_CREDIT_COST}) is then the
 * only limiter, so a Plus user can call a Premium model, it just burns more
 * credits from the shared pool.
 */
export const TIER_ALLOWED_CATEGORIES: Record<AiSubTier | "free", Array<AiModelCategory>> = {
    free: [
        AiModelCategory.Economy,
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
