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
 * Credits per US dollar of real provider cost — the exchange rate that makes a
 * credit MEAN something: 1 credit ≡ $0.0002 spent with the model provider.
 *
 * Every credit figure in the catalog (`creditPerMTokIn/Out`, the flat `credit`)
 * is derived through this constant rather than authored, so a learner's balance
 * always tracks real money instead of a per-tier round number.
 */
export const AI_CREDITS_PER_USD = 5000
