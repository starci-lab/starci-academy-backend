/**
 * Sampling / generation parameters for an AI Lab run, persisted verbatim on
 * playground defaults and individual runs as a jsonb column. Kept loose (all
 * fields optional) so the shape can evolve without a migration; the GraphQL
 * surface for this shape is {@link AiLabRunParamsObject}.
 */
export interface AiLabRunParams {
    /** Sampling temperature (0 = deterministic). Omitted to use the model default. */
    temperature?: number
    /** Nucleus sampling probability mass. Omitted to use the model default. */
    topP?: number
    /** Hard cap on completion tokens. Omitted to use the model default. */
    maxTokens?: number
}
