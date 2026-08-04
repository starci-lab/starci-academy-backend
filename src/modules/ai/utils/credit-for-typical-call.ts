import {
    AI_CREDITS_PER_USD,
    DEFAULT_ESTIMATE_COMPLETION_TOKENS,
    DEFAULT_ESTIMATE_PROMPT_TOKENS,
} from "../constants/credit-cost"
import type {
    ComputeModelWeightParams,
} from "../types"

/**
 * Credits charged per million tokens, derived from a real USD price.
 *
 * A credit is a unit of REAL COST, not an arbitrary token: one credit is
 * {@link AI_CREDITS_PER_USD} of a dollar. Everything the learner spends is
 * therefore a straight function of what the call cost us.
 *
 * @param usdPerMTok - the provider's USD price per million tokens.
 * @returns the credit rate for that side of the call.
 */
export const creditRateFromUsd = (
    usdPerMTok: number,
): number => Math.round(usdPerMTok * AI_CREDITS_PER_USD)

/**
 * Credits a single representative call costs, used as the flat fallback when a
 * provider returns no token usage.
 *
 * Computed from the model's own prices with the same token mix
 * ({@link DEFAULT_ESTIMATE_PROMPT_TOKENS} / {@link DEFAULT_ESTIMATE_COMPLETION_TOKENS})
 * that the billing path falls back to, so the flat charge and the metered
 * charge can never drift apart. Replaces the hand-set per-category constants,
 * which billed a coarse tier cap that bore no relation to what the model
 * actually charges — a cheap model was billed as if it were a frontier one.
 *
 * Never returns 0 for a priced model: a call that costs real money always costs
 * at least one credit.
 *
 * @param params - the model's per-million-token USD prices.
 * @returns the flat credit cost of one call.
 */
export const creditForTypicalCall = (
    {
        priceInUsdPerMTok,
        priceOutUsdPerMTok,
    }: Pick<ComputeModelWeightParams, "priceInUsdPerMTok" | "priceOutUsdPerMTok">,
): number => {
    const credits = (
        DEFAULT_ESTIMATE_PROMPT_TOKENS * creditRateFromUsd(priceInUsdPerMTok)
        + DEFAULT_ESTIMATE_COMPLETION_TOKENS * creditRateFromUsd(priceOutUsdPerMTok)
    ) / 1_000_000
    // a genuinely free model stays free; anything priced rounds up to 1
    return Math.ceil(credits)
}
