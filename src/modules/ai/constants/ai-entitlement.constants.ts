import {
    AiModelCategory,
} from "@modules/databases/postgresql/primary/enums/ai-model-category"
import {
    AiSubTier,
} from "@modules/databases/postgresql/primary/enums/ai-sub-tier"

/** Length of the short rolling window: 5 hours, in milliseconds. */
export const WINDOW_5H_MS = 5 * 60 * 60 * 1000

/** Length of the long rolling window: 7 days, in milliseconds. */
export const WINDOW_WEEK_MS = 7 * 24 * 60 * 60 * 1000

/** Billing period a single paid purchase grants, in months. */
export const SUBSCRIPTION_PERIOD_MONTHS = 1

/**
 * Categories unlocked by each entitlement.
 *
 * `free` (no paid tier, not enrolled) reaches up to **Balanced** -- Free
 * (self-hosted Qwen, 0 credit) + Economy cloud + Balanced. Balanced is included
 * so unpaid learners can still be graded on CODE (challenge githubUrl + capstone
 * tasks floor at Balanced -- see the grading grade-steps), where eval evidence
 * showed Free/Economy models grade too shallowly (miss subtle API-contract
 * defects). Any paid tier (Plus / Pro / Max) additionally unlocks **Premium +
 * Frontier**; token-based credit cost is then the only limiter, so a Plus user
 * can call a Premium model, it just burns more credits from the shared pool.
 */
export const TIER_ALLOWED_CATEGORIES: Record<AiSubTier | "free", Array<AiModelCategory>> = {
    // no plan -> chat (Low) + the grading workhorse (Medium); the strongest rung
    // (High) is paid-only, and unpaid learners are still graded on Medium
    free: [
        AiModelCategory.Low,
        AiModelCategory.Medium,
    ],
    [AiSubTier.Plus]: [
        AiModelCategory.Low,
        AiModelCategory.Medium,
        AiModelCategory.High,
    ],
    [AiSubTier.Pro]: [
        AiModelCategory.Low,
        AiModelCategory.Medium,
        AiModelCategory.High,
    ],
    [AiSubTier.Max]: [
        AiModelCategory.Low,
        AiModelCategory.Medium,
        AiModelCategory.High,
        AiModelCategory.High,
    ],
}
