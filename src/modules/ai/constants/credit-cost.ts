import {
    AiMode,
} from "@modules/databases"
import {
    ModelRecommendation,
} from "../types"

/**
 * Credits charged for one grading run on the free Auto lane when the served
 * model is unknown (e.g. a pre-run quota estimate). 0 — the Auto lane normally
 * grades on the cheapest entitled model. The ACTUAL charge uses the served
 * model's catalog `credit` (see {@link resolveGradingCreditCost}).
 */
export const AUTO_CREDIT_COST = 0

/** Credits charged per model recommendation tier on the Premium lane (pre-run estimate). */
export const RECOMMENDATION_CREDIT_COST: Record<ModelRecommendation, number> = {
    /** Cheapest tier (economy). */
    [ModelRecommendation.Low]: 5,
    /** Balanced tier. */
    [ModelRecommendation.Medium]: 20,
    /** Best-quality tier (premium). */
    [ModelRecommendation.High]: 50,
}

/**
 * Fallback credit for a served model missing from the catalog (balanced-tier
 * default). Callers pass this as the `fallback` to
 * {@link AiModelCatalogService.creditForModel}.
 */
export const DEFAULT_MODEL_CREDIT = 20

/**
 * Token counts assumed for a per-token cost ESTIMATE when the provider did not
 * report usage on a run. Approximates a typical grading/chat call (~1.5k in,
 * ~800 out) so the charge stays close to the real token-based cost instead of
 * falling back to the flat per-model `credit`, which massively over-charges
 * (e.g. a Balanced model's flat 211 vs a real ~24). Used by
 * {@link AiModelCatalogService.creditForRun}.
 */
export const DEFAULT_ESTIMATE_PROMPT_TOKENS = 1500

/** Assumed completion tokens for the no-usage cost estimate — see above. */
export const DEFAULT_ESTIMATE_COMPLETION_TOKENS = 800

/**
 * Resolve how many AI credits a grading run costs.
 *
 * - **Byok lane → 0** (the user pays their own provider).
 * - **`credit` given (post-run charge)** → the served model's catalog `credit`
 *   (resolved by the caller via {@link AiModelCatalogService.creditForModel} —
 *   single source of cost). Free models = 0; economy/balanced/premium/frontier
 *   per the catalog.
 * - **`credit` absent (pre-run estimate / quota gate)** → by lane: Auto →
 *   {@link AUTO_CREDIT_COST}, Premium → {@link RECOMMENDATION_CREDIT_COST}.
 *
 * @param params - The lane, the recommendation tier, and (when known) the
 *   served model's resolved `credit`.
 * @returns The number of credits to charge.
 */
export const resolveGradingCreditCost = (
    {
        mode,
        recommendation,
        credit,
    }: {
        mode: AiMode
        recommendation: ModelRecommendation
        credit?: number
    },
): number => {
    if (mode === AiMode.Byok) {
        return 0
    }
    // accurate, post-run charge: bill by the served model's catalog credit
    if (credit !== undefined) {
        return credit
    }
    // pre-run estimate (served model not yet known)
    if (mode === AiMode.Auto) {
        return AUTO_CREDIT_COST
    }
    return RECOMMENDATION_CREDIT_COST[recommendation] ?? 0
}
