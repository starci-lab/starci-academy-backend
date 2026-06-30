/**
 * Fallback Auto-lane CREDIT caps when `systemConfig.ai.auto` is absent from
 * `app.yaml`. Pure credit-based — the legacy "uses/lượt" model is gone. Free
 * base = 50 credits/5h · 250 credits/week (paid tiers OVERRIDE these).
 */

/** Default Auto credits per 5-hour window (free base). */
export const DEFAULT_AI_AUTO_CREDITS_PER_5H = 50

/** Default Auto credits per 7-day window (free base). */
export const DEFAULT_AI_AUTO_CREDITS_PER_WEEK = 250

/** Default credits charged per Auto grading (estimate when token usage unknown). */
export const DEFAULT_AI_AUTO_CREDIT_COST = 10
