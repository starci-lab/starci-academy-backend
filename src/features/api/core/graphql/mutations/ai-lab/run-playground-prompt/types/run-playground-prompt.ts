import type {
    AiLabRunStatus,
    Locale,
} from "@modules/databases"
import type {
    RunPlaygroundPromptInput,
} from "../graphql-types"

/** Params for {@link RunPlaygroundPromptService.execute}. */
export interface RunPlaygroundPromptParams {
    /** Validated mutation input (playground, prompts, params, lane selection). */
    input: RunPlaygroundPromptInput
    /** Authenticated learner id issuing the run. */
    userId: string
    /** Request locale (injected from the locale header). */
    locale: Locale
}

/** Result of {@link RunPlaygroundPromptService.execute}. */
export interface RunPlaygroundPromptResult {
    /** Persisted run id; drives the Socket.IO subscription on a fresh run. */
    runId: string
    /** Full cached output on a cache hit; null when the run must be streamed. */
    cachedOutput: string | null
    /** Lifecycle status right after creation (Cached or Streaming). */
    status: AiLabRunStatus
    /** Runs the learner may still issue in the current window. */
    remainingRuns: number
    /** Whether the learner's AI quota is exhausted. */
    quotaExhausted: boolean
}
