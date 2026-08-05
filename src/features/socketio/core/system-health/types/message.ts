import type {
    AiModelHealthSnapshot,
} from "@modules/platform/event/types/event-payload/ai-model-health-updated"

/**
 * Server -> client message broadcast when a per-model AI latency probe cycle
 * completes. Carries the full snapshot of every probed model so the status page
 * can re-render in one shot.
 */
export interface AiModelHealthSocketIoMessage {
    /** One entry per probed model (the whole cycle's snapshot). */
    models: Array<AiModelHealthSnapshot>
}
