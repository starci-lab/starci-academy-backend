import type {
    ModelProvider,
} from "@modules/databases"

/**
 * Cached result for {@link CacheKey.AiLabRun}.
 *
 * Redis fast-path snapshot of a completed AI Lab playground run, keyed by
 * `(playgroundId, userId, inputHash)`. Lets an identical re-run be served
 * without re-invoking the model; the durable copy lives in the `ai_lab_runs`
 * cold store.
 */
export interface AiLabRunCacheResult {
    /** Persisted run id this cached output belongs to. */
    runId: string
    /** Full model output text produced by the original run. */
    output: string
    /** Concrete model name that served the original run. */
    model: string
    /** Provider that served the original run. */
    provider: ModelProvider
    /** Prompt tokens consumed by the original run. */
    promptTokens: number
    /** Completion tokens produced by the original run. */
    completionTokens: number
}
