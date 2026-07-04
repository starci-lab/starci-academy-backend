import type {
    AiLabRunParams,
    ModelProvider,
} from "@modules/databases"

/** Params for {@link AiLabCacheService.computeInputHash}. */
export interface ComputeInputHashParams {
    /** System prompt portion of the run inputs (null when none). */
    systemPrompt: string | null
    /** User prompt portion of the run inputs. */
    userPrompt: string
    /** Sampling / generation parameters portion of the run inputs. */
    params: AiLabRunParams
    /** Concrete model name the run targets. */
    model: string
    /** Provider serving the model. */
    provider: ModelProvider
}

/** Params for {@link AiLabCacheService.lookup}. */
export interface LookupCachedRunParams {
    /** Playground the run belongs to. */
    playgroundId: string
    /** Owner of the run. */
    userId: string
    /** Input hash computed via {@link AiLabCacheService.computeInputHash}. */
    inputHash: string
}

/** A cached run hit returned by {@link AiLabCacheService.lookup}. */
export interface CachedRun {
    /** Persisted run id of the cached run. */
    runId: string
    /** Full cached model output. */
    output: string
    /** Concrete model name that served the cached run. */
    model: string
    /** Provider that served the cached run. */
    provider: ModelProvider
    /** Prompt tokens consumed by the cached run. */
    promptTokens: number
    /** Completion tokens produced by the cached run. */
    completionTokens: number
}

/** Result of {@link AiLabCacheService.lookup}. */
export interface LookupCachedRunResult {
    /** The cached run when a hit exists; null on a miss. */
    cachedRun: CachedRun | null
}

/** Params for {@link AiLabCacheService.store}. */
export interface StoreCachedRunParams {
    /** Playground the run belongs to. */
    playgroundId: string
    /** Owner of the run. */
    userId: string
    /** Input hash the run is keyed by. */
    inputHash: string
    /** The completed run to cache (id + output + model metadata). */
    run: CachedRun
}
