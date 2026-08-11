import RequestQueue from "kafkajs/src/network/requestQueue"
import type {
    KafkaRequestQueueInternals,
    KafkaRequestQueueThrottlePatchOutcome,
} from "./types"

/** KafkaJS's own retry cadence for a queue that is backed up but not throttled. */
const CHECK_PENDING_REQUESTS_INTERVAL_MS = 10

/** The replacement scheduler, plus the flag that makes re-application a no-op. */
interface ThrottleCheckScheduler {
    (this: KafkaRequestQueueInternals): void
    /** Set once the guard is installed on `RequestQueue.prototype`. */
    starciThrottlePatched?: true
}

/**
 * Guarded replacement for KafkaJS 2.2.4's
 * `RequestQueue.prototype.scheduleCheckPendingRequests`.
 *
 * Upstream computes `throttledUntil - Date.now()` and only clamps the result on
 * the branch where requests are actually pending. `throttledUntil` is the
 * sentinel `-1` until a broker throttles us, so on a healthy queue that
 * subtraction is roughly `-Date.now()`: about -56 years. Node clamps a negative
 * `setTimeout` to 1ms (warning once per process with `TimeoutNegativeWarning`),
 * the callback nulls the handle and calls `checkPendingRequests()`, which
 * schedules the same negative delay again -- a permanent ~1ms timer loop per
 * broker connection, for the life of the process.
 *
 * This version keeps all three of upstream's meaningful branches and adds the
 * missing one: when nothing is pending and no throttle window is open there is
 * nothing for the check to do, so it arms no timer at all. `push()` re-arms the
 * check the moment a request genuinely goes pending, so no wake-up is lost.
 */
function scheduleCheckPendingRequests(
    this: KafkaRequestQueueInternals,
): void {
    // a check is already armed -- it re-evaluates from scratch when it fires
    if (this.throttleCheckTimeoutId) {
        return
    }
    const throttleRemainingMs = this.throttledUntil - Date.now()
    const hasPendingRequests = this.pending.length > 0
    // the branch upstream is missing: idle queue, no throttle left to wait out
    if (!hasPendingRequests && throttleRemainingMs <= 0) {
        return
    }
    // still throttled -> wake exactly when the window closes; otherwise we are
    // merely over the in-flight limit -> poll at KafkaJS's own cadence
    const scheduleAtMs = throttleRemainingMs > 0
        ? throttleRemainingMs
        : CHECK_PENDING_REQUESTS_INTERVAL_MS
    this.throttleCheckTimeoutId = setTimeout(
        () => {
            this.throttleCheckTimeoutId = null
            this.checkPendingRequests()
        },
        scheduleAtMs,
    )
}

/**
 * Install {@link scheduleCheckPendingRequests} over KafkaJS's own, so no Kafka
 * connection can spin a clamped 1ms timer loop.
 *
 * Idempotent, so it is safe to call from every {@link KafkaService} instance. If
 * a KafkaJS upgrade moves or renames the internals this bolts onto, the library
 * is left untouched and the caller is told, rather than patching blind.
 *
 * @returns What the call did -- see {@link KafkaRequestQueueThrottlePatchOutcome}.
 *
 * @example
 * // KafkaService constructor, before any consumer/admin can connect
 * const outcome = applyKafkaRequestQueueThrottlePatch()
 */
export const applyKafkaRequestQueueThrottlePatch = (): KafkaRequestQueueThrottlePatchOutcome => {
    const prototype = RequestQueue.prototype
    const current: ThrottleCheckScheduler | undefined = prototype.scheduleCheckPendingRequests
    if (current?.starciThrottlePatched) {
        return "already-applied"
    }
    // shape gate: both the method we replace and the one our replacement calls
    // back into must be where we expect them
    if (
        typeof current !== "function"
        || typeof prototype.checkPendingRequests !== "function"
    ) {
        return "skipped"
    }
    const patched: ThrottleCheckScheduler = scheduleCheckPendingRequests
    patched.starciThrottlePatched = true
    prototype.scheduleCheckPendingRequests = patched
    return "applied"
}
