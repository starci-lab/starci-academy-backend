import type {
    DeferredPromise
} from "p-defer"

/**
 * State of a readiness watcher.
 * - `"pending"`: still waiting to become ready.
 * - `"ready"`: the watched resource is ready.
 * - `"error"`: readiness failed with an error.
 */
export type WatcherState = "pending" | "ready" | "error"

/** A named deferred promise for readiness. */
export interface ReadinessWatcher {
    /** Unique name identifying the watched resource. */
    name: string
    /** Deferred promise resolved when readiness is reached (or rejected on error). */
    deferred: DeferredPromise<void>
    /** Current lifecycle state of the watcher. */
    state: WatcherState
}

/** Params for building a readiness watcher name (hashed). */
export interface GetReadinessWatcherNameParams {
    /** Base name of the watched resource. */
    name: string
    /** Additional parameters folded into the hashed watcher name for uniqueness. */
    params: Record<string, string>
}
