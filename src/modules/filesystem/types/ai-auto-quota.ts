/**
 * Free Auto-lane quota from `systemConfig.ai.auto` in mounted `app.yaml`.
 */
export interface AppConfigSystemAiAuto {
    /** Max complimentary gradings per rolling 5-hour window (lượt). */
    usesPer5h: number
    /** Max complimentary gradings per rolling 7-day window (lượt). */
    usesPerWeek: number
    /** Max Auto credits per rolling 5-hour window. */
    creditsPer5h: number
    /** Max Auto credits per rolling 7-day window. */
    creditsPerWeek: number
    /** Credits charged per Auto grading when not overridden in code paths. */
    creditCost: number
}

/** `systemConfig.ai` in mounted `app.yaml`. */
export interface AppConfigSystemAi {
    /** Free Auto lane caps (uses + credits per window). */
    auto: AppConfigSystemAiAuto
}
