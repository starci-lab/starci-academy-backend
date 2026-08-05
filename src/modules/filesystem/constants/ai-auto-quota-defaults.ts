/**
 * Fallback Auto-lane CREDIT caps when `systemConfig.ai.auto` is absent from
 * `app.yaml`. Pure credit-based -- the legacy per-use model is gone. Free
 * base = 100 credits/5h - 500 credits/week (paid tiers OVERRIDE these). PROD
 * relies on these defaults (its app.yaml has no `ai.auto` block), so this IS the
 * prod free-base; local `app.yaml` sets the same 100/500 explicitly.
 */

/** Default Auto credits per 5-hour window (free base). */
export const DEFAULT_AI_AUTO_CREDITS_PER_5H = 100

/** Default Auto credits per 7-day window (free base). */
export const DEFAULT_AI_AUTO_CREDITS_PER_WEEK = 500

/** Default credits charged per Auto grading (estimate when token usage unknown). */
export const DEFAULT_AI_AUTO_CREDIT_COST = 10
