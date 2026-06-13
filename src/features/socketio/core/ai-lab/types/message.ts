import type {
    AiLabRunStatus,
} from "@modules/databases"

/**
 * Server → client message carrying one streamed token delta for an AI Lab run.
 *
 * The final emission of a stream sets `done: true`; for a cache hit a single
 * message carries the full output with `done: true` and `status: Cached`.
 */
export interface AiLabRunChunkSocketIoMessage {
    /** Run this chunk belongs to. */
    runId: string
    /**
     * Incremental text produced since the previous chunk. On the terminal `done`
     * emission this is the empty string (fresh run) or the full output (cache hit).
     */
    delta: string
    /** Whether this is the final chunk of the stream. */
    done: boolean
    /** Lifecycle status of the run at this emission (Streaming / Completed / Cached / Failed). */
    status: AiLabRunStatus
    /** Prompt tokens consumed (present on the terminal chunk of a completed run). */
    promptTokens?: number
    /** Completion tokens produced (present on the terminal chunk of a completed run). */
    completionTokens?: number
}
