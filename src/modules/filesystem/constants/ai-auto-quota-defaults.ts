/**
 * Fallback Auto-lane caps when `systemConfig.ai.auto` is absent from `app.yaml`.
 * Week credits = 25 uses × 10 credits/grading = 250 (free base; paid tiers override).
 */
export const DEFAULT_AI_AUTO_USES_PER_5H = 5

/** Default complimentary gradings per 7-day window. */
export const DEFAULT_AI_AUTO_USES_PER_WEEK = 25

/** Default Auto credits per 5-hour window. */
export const DEFAULT_AI_AUTO_CREDITS_PER_5H = 50

/** Default Auto credits per 7-day window. */
export const DEFAULT_AI_AUTO_CREDITS_PER_WEEK = 250

/** Default credits charged per Auto grading. */
export const DEFAULT_AI_AUTO_CREDIT_COST = 10
