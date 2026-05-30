/**
 * Total AI credits a user is allowed to consume per rolling window before being
 * over quota. Usage is summed from `credit_usage_histories` (the source of truth).
 * 50 credits ≈ 5 free Auto gradings (10 credits each).
 */
export const CREDIT_QUOTA = 50

/**
 * Length of the rolling credit window, in days. Credits older than this no longer
 * count toward the quota, so the quota "recovers" as old charges age out.
 */
export const CREDIT_WINDOW_DAYS = 7
