import type {
    BaseMessage,
} from "@langchain/core/messages"
import type {
    AiLabRunParams,
    AiLabRunStatus,
    Locale,
    ModelProvider,
} from "@modules/databases"
import type {
    AiJobSelection,
    ResolveGradingInvokeOptionsResult,
} from "@modules/ai"

/** Params for {@link AiLabRunService.createRun}. */
export interface CreateRunParams {
    /** Learner issuing the run. */
    userId: string
    /** Playground the run belongs to. */
    playgroundId: string
    /** System prompt the learner submitted (null when none). */
    systemPrompt: string | null
    /** User prompt the learner submitted. */
    userPrompt: string
    /** Sampling / generation parameters for the run. */
    params: AiLabRunParams
    /** Learner's resolved lane + model selection (absent → Auto). */
    ai?: AiJobSelection
    /** Locale the run is issued under (for prompt localization downstream). */
    locale: Locale
}

/** Result of {@link AiLabRunService.createRun}. */
export interface CreateRunResult {
    /** Persisted run id (always present — drives the gateway subscription). */
    runId: string
    /**
     * Full cached output when the run was a cache hit; null when the run is
     * fresh and must be streamed over the gateway.
     */
    cachedOutput: string | null
    /** Lifecycle status of the run right after creation (Cached or Streaming). */
    status: AiLabRunStatus
    /**
     * Invoke options resolved from entitlement + selection. Present only on a
     * fresh run so the gateway can build the streaming client; null on a hit.
     */
    invokeOptions: ResolveGradingInvokeOptionsResult | null
    /** Remaining runs the learner may still issue in the current window. */
    remainingRuns: number
    /** Whether the learner's AI quota is exhausted (FE nudge). */
    quotaExhausted: boolean
}

/** Params for {@link AiLabRunService.buildStreamMessages}. */
export interface BuildStreamMessagesParams {
    /** System prompt for the run (null when none). */
    systemPrompt: string | null
    /** User prompt for the run. */
    userPrompt: string
}

/** Result of {@link AiLabRunService.buildStreamMessages}. */
export interface BuildStreamMessagesResult {
    /** Ordered chat messages (optional system + human) to stream. */
    messages: Array<BaseMessage>
}

/** Params for {@link AiLabRunService.persistRunOutput}. */
export interface PersistRunOutputParams {
    /** Run id whose output is being finalized. */
    runId: string
    /** Full model output produced by the stream. */
    output: string
    /** Concrete model name that served the run. */
    model: string
    /** Provider that served the run. */
    provider: ModelProvider
    /** Prompt tokens consumed by the run. */
    promptTokens: number
    /** Completion tokens produced by the run. */
    completionTokens: number
}

/** Params for {@link AiLabRunService.prepareStream}. */
export interface PrepareStreamParams {
    /** Run id the gateway is about to stream (created earlier by {@link AiLabRunService.createRun}). */
    runId: string
}

/** Result of {@link AiLabRunService.prepareStream}. */
export interface PrepareStreamResult {
    /** Run id echoed back for the gateway's room + chunk payloads. */
    runId: string
    /** Lifecycle status of the loaded run (Cached short-circuits the model call). */
    status: AiLabRunStatus
    /**
     * Full stored output when the run is a cache hit (status Cached); the gateway
     * emits this as a single final chunk and never calls the model. Null for a
     * fresh run that must be streamed.
     */
    cachedOutput: string | null
    /**
     * Ordered chat messages to stream for a fresh run; empty for a cache hit.
     */
    messages: Array<BaseMessage>
    /**
     * Invoke options (lane / category / pinned model) the gateway hands
     * to {@link AiInvokeService.stream}; null for a cache hit.
     */
    invokeOptions: ResolveGradingInvokeOptionsResult | null
    /** Concrete model the run is pinned to (for the persisted output row). */
    model: string
    /** Provider the run is pinned to (for the persisted output row). */
    provider: ModelProvider
}

/** Params for {@link AiLabRunService.markRunFailed}. */
export interface MarkRunFailedParams {
    /** Run id whose stream failed or was aborted. */
    runId: string
    /** Human-readable failure reason stored on the run. */
    errorMessage: string
}

/**
 * Result of pulling the loose `model` / `provider` out of a lane selection for
 * the validation call. Auto carries neither field; Premium carries both.
 */
export interface SelectionModelProviderResult {
    /** Concrete model pinned by the selection; absent for the Auto lane. */
    model?: string
    /** Provider pinned by the selection; absent for the Auto lane. */
    provider?: ModelProvider
}

/**
 * Result of resolving the concrete `(model, provider)` a run will use, for the
 * cache key and the persisted row.
 */
export interface ResolveModelProviderResult {
    /** Concrete model name that will serve the run. */
    model: string
    /** Provider that will serve the run. */
    provider: ModelProvider
}

/** Params for {@link AiLabRunService.getRemainingRuns}. */
export interface GetRemainingRunsParams {
    /** Owner whose remaining runs are counted. */
    userId: string
    /** Playground to scope the per-window run count to. */
    playgroundId: string
}

/** Result of {@link AiLabRunService.getRemainingRuns}. */
export interface GetRemainingRunsResult {
    /** Runs the learner may still issue in the current window (0 when exhausted). */
    remainingRuns: number
    /** Whether the learner's AI quota is exhausted. */
    quotaExhausted: boolean
}
