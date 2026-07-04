import {
    AiModelCategory,
    AiSubTier,
} from "@modules/databases"

/**
 * Credit cost of a single LLM call by model category — unified with the grading
 * tiers (Low/Medium/High = 5/20/50 in `credit-cost.ts`).
 * Free (self-hosted Qwen) is 0; Premium flagship models cost the most.
 */
export const CATEGORY_CREDIT_COST: Record<AiModelCategory, number> = {
    [AiModelCategory.Free]: 0,
    [AiModelCategory.Economy]: 5,
    [AiModelCategory.Balanced]: 20,
    [AiModelCategory.Premium]: 50,
    [AiModelCategory.Frontier]: 100,
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
 * `free` (no paid tier, not enrolled) reaches up to **Balanced** — Free
 * (self-hosted Qwen, 0 credit) + Economy cloud + Balanced. Balanced is included
 * so unpaid learners can still be graded on CODE (challenge githubUrl + capstone
 * tasks floor at Balanced — see the grading grade-steps), where eval evidence
 * showed Free/Economy models grade too shallowly (miss subtle API-contract
 * defects). Any paid tier (Plus / Pro / Max) additionally unlocks **Premium +
 * Frontier**; credit cost (see {@link CATEGORY_CREDIT_COST}) is then the only
 * limiter, so a Plus user can call a Premium model, it just burns more credits
 * from the shared pool.
 */
export const TIER_ALLOWED_CATEGORIES: Record<AiSubTier | "free", Array<AiModelCategory>> = {
    // no plan → free (self-hosted Qwen, 0 credit) + economy + balanced cloud
    free: [
        AiModelCategory.Free,
        AiModelCategory.Economy,
        AiModelCategory.Balanced,
    ],
    [AiSubTier.Plus]: [
        AiModelCategory.Free,
        AiModelCategory.Economy,
        AiModelCategory.Balanced,
        AiModelCategory.Premium,
        AiModelCategory.Frontier,
    ],
    [AiSubTier.Pro]: [
        AiModelCategory.Free,
        AiModelCategory.Economy,
        AiModelCategory.Balanced,
        AiModelCategory.Premium,
        AiModelCategory.Frontier,
    ],
    [AiSubTier.Max]: [
        AiModelCategory.Free,
        AiModelCategory.Economy,
        AiModelCategory.Balanced,
        AiModelCategory.Premium,
        AiModelCategory.Frontier,
    ],
}
