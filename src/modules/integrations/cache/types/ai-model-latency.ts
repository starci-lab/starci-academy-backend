import type {
    ModelProvider,
} from "@modules/databases/postgresql/primary/enums/model-provider"

/**
 * Cached latency-probe snapshot for one AI model.
 *
 * Written by the per-model latency probe scheduler every cycle and read by the
 * public `aiModelLatency` query + broadcast over Socket.IO. UI/status only --
 * NOT used for balancer key eligibility (that lives in the ping cache).
 */
export interface ModelLatencyEntry {
    /** Provider that serves the probed model (e.g. `local`, `openai`). */
    provider: ModelProvider
    /** Whether the latest 1-token probe completion succeeded. */
    ok: boolean
    /** Round-trip latency in ms for the latest probe (0 when it failed). */
    latencyMs: number
    /** ISO-8601 timestamp of the latest probe attempt. */
    checkedAt: string
    /** Short failure reason when the probe failed, else null. */
    errorMessage: string | null
}

/**
 * Full Redis payload for the per-model latency probe: model name -> snapshot.
 */
export type AiModelLatencyMap = Record<string, ModelLatencyEntry>

/**
 * Params for {@link AiModelLatencyCacheService.recordModelLatency} -- persist the
 * outcome of one model probe.
 */
export interface RecordModelLatencyParams {
    /** Concrete model name that was probed (the map key). */
    model: string
    /** Provider that serves the probed model. */
    provider: ModelProvider
    /** Whether the 1-token probe completion succeeded. */
    ok: boolean
    /** Round-trip latency in ms (0 when the probe failed). */
    latencyMs: number
    /** Short failure reason when the probe failed, else null. */
    errorMessage: string | null
}
