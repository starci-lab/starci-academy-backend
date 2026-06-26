import {
    AiMode,
} from "@modules/databases"
import {
    ModelRecommendation,
} from "../types"

/**
 * Credits charged for one grading run on the free Auto lane when the served
 * model is unknown (e.g. a pre-run quota estimate). 0 — the Auto lane normally
 * grades on the self-hosted `local` Qwen (0 cost). The ACTUAL charge uses the
 * served model via {@link MODEL_CREDIT} (see {@link resolveGradingCreditCost}).
 */
export const AUTO_CREDIT_COST = 0

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
 * Per-model credit cost, charged by the model that ACTUALLY served the run.
 *
 * - Self-hosted `local` Qwen → 0 (free).
 * - Economy cloud (the Auto-lane fallback when the host is offline) → 5.
 * - Balanced cloud → 10. Premium cloud → 20.
 *
 * Keyed by the concrete model name returned by the balancer. Unknown models
 * fall back to {@link DEFAULT_MODEL_CREDIT}.
 */
export const MODEL_CREDIT: Record<string, number> = {
    "qwen2.5-coder:7b": 0,
    "gpt-5.4-nano": 5,
    "gemini-2.5-flash-lite": 5,
    "gpt-5.4-mini": 10,
    "gemini-3.5-flash": 10,
    "gemini-3.1-pro": 20,
}

/** Credit for a model not listed in {@link MODEL_CREDIT} (balanced-tier default). */
export const DEFAULT_MODEL_CREDIT = 10

/**
 * Resolve how many AI credits a grading run costs.
 *
 * - **Byok lane → 0** (the user pays their own provider).
 * - **`model` given (post-run charge)** → per-model cost from {@link MODEL_CREDIT}
 *   (Qwen 0, economy 5, balanced 10, premium 20). This is the accurate charge:
 *   the Auto lane is free on Qwen but costs the model's credit when it falls
 *   through to a paid cloud model.
 * - **`model` absent (pre-run estimate / quota gate)** → by lane: Auto →
 *   {@link AUTO_CREDIT_COST}, Premium → {@link RECOMMENDATION_CREDIT_COST}.
 *
 * @param params - The lane, the recommendation tier, and (when known) the
 *   concrete model that served the run.
 * @returns The number of credits to charge.
 */
export const resolveGradingCreditCost = (
    {
        mode,
        recommendation,
        model,
    }: {
        mode: AiMode
        recommendation: ModelRecommendation
        model?: string
    },
): number => {
    if (mode === AiMode.Byok) {
        return 0
    }
    // accurate, post-run charge: bill by the model that actually served
    if (model) {
        return MODEL_CREDIT[model] ?? DEFAULT_MODEL_CREDIT
    }
    // pre-run estimate (served model not yet known)
    if (mode === AiMode.Auto) {
        return AUTO_CREDIT_COST
    }
    return RECOMMENDATION_CREDIT_COST[recommendation] ?? 0
}
