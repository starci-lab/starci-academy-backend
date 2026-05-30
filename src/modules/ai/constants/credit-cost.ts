import {
    AiMode,
} from "@modules/databases"
import {
    ModelRecommendation,
} from "../types"

/** Credits charged for one grading run on the free Auto lane. */
export const AUTO_CREDIT_COST = 10

/** Credits charged per model recommendation tier on the Premium lane. */
export const RECOMMENDATION_CREDIT_COST: Record<ModelRecommendation, number> = {
    /** Cheapest tier. */
    [ModelRecommendation.Low]: 10,
    /** Balanced tier. */
    [ModelRecommendation.Medium]: 20,
    /** Best-quality tier. */
    [ModelRecommendation.High]: 30,
}

/**
 * Resolve how many AI credits a grading run costs.
 * - Auto lane → flat {@link AUTO_CREDIT_COST}.
 * - Premium lane → by model recommendation tier ({@link RECOMMENDATION_CREDIT_COST}).
 * - Byok lane → 0 (the user pays their own provider).
 * @param params - The resolved AI lane and the model recommendation tier.
 * @returns The number of credits to charge.
 */
export const resolveGradingCreditCost = (
    {
        mode,
        recommendation,
    }: {
        mode: AiMode
        recommendation: ModelRecommendation
    },
): number => {
    if (mode === AiMode.Auto) {
        return AUTO_CREDIT_COST
    }
    if (mode === AiMode.Byok) {
        return 0
    }
    return RECOMMENDATION_CREDIT_COST[recommendation] ?? 0
}
