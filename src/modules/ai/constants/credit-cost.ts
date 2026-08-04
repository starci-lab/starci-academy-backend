/**
 * Fallback credit for a served model missing from the catalog (balanced-tier
 * default). Callers pass this as the `fallback` to
 * {@link AiModelCatalogService.creditForRun}.
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
 * Credits per US dollar of real provider cost — the exchange rate that makes a
 * credit MEAN something: 1 credit ≡ $0.0002 spent with the model provider.
 *
 * Every credit figure in the catalog (`creditPerMTokIn/Out`, the flat `credit`)
 * is derived through this constant rather than authored, so a learner's balance
 * always tracks real money instead of a per-tier round number.
 */
export const AI_CREDITS_PER_USD = 5000

/**
 * Share of the normal input rate a prompt-cache HIT is billed at.
 *
 * OpenRouter re-prices a cache read at roughly 0.1x (Anthropic) to 0.5x (OpenAI)
 * of a fresh input token and passes that discount through to us. We bill the
 * learner at the least generous end of that range: it never charges less than
 * the call could plausibly have cost, while still refusing to bill a discounted
 * token at full price.
 *
 * Deliberately one constant rather than a per-model column: the real multiplier
 * is a property of the upstream provider and moves without notice, so a number
 * frozen into a seed row would go stale silently. Promote it to a metric on the
 * catalog only once the response tells us the true per-call discount.
 */
export const CACHE_READ_RATE_MULTIPLIER = 0.5
