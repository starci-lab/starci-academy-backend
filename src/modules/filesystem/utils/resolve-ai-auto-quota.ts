import type {
    AppConfig,
    AppConfigSystemAiAuto,
} from "../types"
import {
    DEFAULT_AI_AUTO_CREDIT_COST,
    DEFAULT_AI_AUTO_CREDITS_PER_5H,
    DEFAULT_AI_AUTO_CREDITS_PER_WEEK,
} from "../constants"

/**
 * Resolve free Auto-lane CREDIT caps from mounted `app.yaml` with product
 * defaults. Pure credit-based (the legacy "uses/lượt" model is removed).
 * @param appConfig - Runtime app config (`MountStorageService` / `getAppConfig()`).
 * @returns Merged Auto credit quota (per window + per-grading cost estimate).
 */
export const resolveAiAutoQuota = (
    appConfig: AppConfig,
): AppConfigSystemAiAuto => {
    const raw = appConfig.systemConfig?.ai?.auto
    return {
        creditsPer5h: raw?.creditsPer5h ?? DEFAULT_AI_AUTO_CREDITS_PER_5H,
        creditsPerWeek: raw?.creditsPerWeek ?? DEFAULT_AI_AUTO_CREDITS_PER_WEEK,
        creditCost: raw?.creditCost ?? DEFAULT_AI_AUTO_CREDIT_COST,
    }
}
