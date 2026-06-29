import type {
    AiModelCategory,
    ModelProvider,
} from "@modules/databases"

/**
 * One model's latency snapshot inside an {@link AiModelHealthUpdatedEventPayload}.
 * Public-safe: model identity + up/down + latency + freshness only (no keys).
 */
export interface AiModelHealthSnapshot {
    /** Concrete model name (e.g. "qwen2.5-coder:7b"). */
    name: string
    /** Provider that serves the model. */
    provider: ModelProvider
    /** Coarse cost/quality category of the model. */
    category: AiModelCategory
    /** Whether the latest 1-token probe succeeded. */
    ok: boolean
    /** Round-trip latency in ms for the latest probe (0 when it failed). */
    latencyMs: number
    /** ISO-8601 timestamp of the latest probe. */
    checkedAt: string
}

/**
 * Payload emitted after each per-model latency probe cycle completes — the full
 * snapshot of every probed model. The system-health gateway broadcasts it to
 * all connected clients so the public status page updates in real time.
 */
export interface AiModelHealthUpdatedEventPayload {
    /** One entry per probed model (the whole cycle's snapshot). */
    models: Array<AiModelHealthSnapshot>
}
