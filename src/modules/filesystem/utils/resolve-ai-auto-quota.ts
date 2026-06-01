import type {
    AppConfig,
    AppConfigSystemAiAuto,
} from "../types"
import {
    DEFAULT_AI_AUTO_CREDIT_COST,
    DEFAULT_AI_AUTO_USES_PER_5H,
    DEFAULT_AI_AUTO_USES_PER_WEEK,
} from "../constants"

/**
 * Resolve free Auto-lane caps from mounted `app.yaml` with product defaults.
 * @param appConfig - Runtime app config (`MountStorageService` / `getAppConfig()`).
 * @returns Merged Auto quota (uses + credits per window).
 */
export const resolveAiAutoQuota = (
    appConfig: AppConfig,
): AppConfigSystemAiAuto => {
    const raw = appConfig.systemConfig?.ai?.auto
    const creditCost = raw?.creditCost ?? DEFAULT_AI_AUTO_CREDIT_COST
    const usesPer5h = raw?.usesPer5h ?? DEFAULT_AI_AUTO_USES_PER_5H
    const usesPerWeek = raw?.usesPerWeek ?? DEFAULT_AI_AUTO_USES_PER_WEEK
    const creditsPer5h = raw?.creditsPer5h
        ?? usesPer5h * creditCost
    const creditsPerWeek = raw?.creditsPerWeek
        ?? usesPerWeek * creditCost
    return {
        usesPer5h,
        usesPerWeek,
        creditsPer5h,
        creditsPerWeek,
        creditCost,
    }
}
