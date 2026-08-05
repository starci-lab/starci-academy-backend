import {
    DEFAULT_ESTIMATE_COMPLETION_TOKENS,
    DEFAULT_ESTIMATE_PROMPT_TOKENS,
} from "../constants/credit-cost"
import type {
    ComputeModelWeightParams,
} from "../types"

/**
 * Context window that scores a neutral `capacity` factor of 1.0. A model with a
 * 1M window neither gains nor loses ground; a larger window scores above 1.
 */
export const WEIGHT_CONTEXT_REFERENCE_TOKENS = 1_000_000

/**
 * Per-call cost that scores a neutral `affordability` factor of 1.0 (USD). At
 * $0.001 a typical call, a cheaper model scores above 1 and a dearer one below.
 */
export const WEIGHT_COST_REFERENCE_USD = 0.001

/**
 * Floor applied to the per-call cost before dividing, so a genuinely free model
 * yields a large-but-finite factor instead of `Infinity`.
 */
export const WEIGHT_MIN_COST_USD = 0.000_001

/**
 * Cost of one typical call, in USD, using the same prompt/completion token mix
 * the billing estimator assumes ({@link DEFAULT_ESTIMATE_PROMPT_TOKENS} /
 * {@link DEFAULT_ESTIMATE_COMPLETION_TOKENS}).
 *
 * @param params - the model's per-million-token USD prices.
 * @returns USD cost of a single representative call.
 */
export const estimateUsdPerCall = (
    {
        priceInUsdPerMTok,
        priceOutUsdPerMTok,
    }: Pick<ComputeModelWeightParams, "priceInUsdPerMTok" | "priceOutUsdPerMTok">,
): number =>
    (DEFAULT_ESTIMATE_PROMPT_TOKENS * priceInUsdPerMTok
        + DEFAULT_ESTIMATE_COMPLETION_TOKENS * priceOutUsdPerMTok)
    / 1_000_000

/**
 * Rank a model within its category: **cheaper and roomier is stronger**.
 *
 * The score is a PRODUCT of dimensionless factors, each normalised against a
 * reference so that 1.0 means "unremarkable":
 *
 * ```
 * capacity      = contextWindowTokens / WEIGHT_CONTEXT_REFERENCE_TOKENS
 * affordability = WEIGHT_COST_REFERENCE_USD / usdPerCall
 * weight        = capacity x affordability
 * ```
 *
 * A product rather than a weighted sum, because the roster is expected to grow
 * new metrics (measured latency, success rate, a benchmark index). A new factor
 * multiplies in without re-tuning the existing ones, and a metric we do not have
 * contributes exactly 1.0 -- so an unknown value leaves the ranking untouched
 * instead of silently scoring the model as zero.
 *
 * Replaces the hand-typed `weight` the seed used to carry, which was anchored to
 * nothing and had to be re-guessed whenever a model was added.
 *
 * @param params - the model's prices and (optional) context window.
 * @returns the ranking weight; higher sorts earlier within a category.
 */
export const computeModelWeight = (
    {
        priceInUsdPerMTok,
        priceOutUsdPerMTok,
        contextWindowTokens,
    }: ComputeModelWeightParams,
): number => {
    const usdPerCall = Math.max(
        estimateUsdPerCall({
            priceInUsdPerMTok,
            priceOutUsdPerMTok,
        }),
        WEIGHT_MIN_COST_USD,
    )
    // an unrecorded window must not zero the score -- it contributes nothing
    const capacity = contextWindowTokens
        ? contextWindowTokens / WEIGHT_CONTEXT_REFERENCE_TOKENS
        : 1
    const affordability = WEIGHT_COST_REFERENCE_USD / usdPerCall
    return capacity * affordability
}
