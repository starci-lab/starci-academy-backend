/**
 * Auto credit caps are read from `systemConfig.ai.auto` in mounted `app.yaml`
 * via {@link AiAutoQuotaConfigService} (defaults: 50 / 5h, 500 / 7d).
 */

/**
 * Length of the rolling credit window, in days. Credits older than this no longer
 * count toward the quota, so the quota "recovers" as old charges age out.
 */
export const CREDIT_WINDOW_DAYS = 7

/** Rolling 5-hour window length in hours (for credit sums). */
export const CREDIT_WINDOW_5H_HOURS = 5
