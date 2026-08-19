import type {
    DecideReconcileActionParams,
    ReconcileAction,
} from "./types/decide-reconcile-action"

/**
 * Picks the next action for one reconcile poll from the gateway's report,
 * the DB transaction's expected amount, and the current attempt/lane state.
 *
 * @example
 * const action = decideReconcileAction({ result, expectedAmountVnd, attempt, maxAttempts, lane })
 */
export const decideReconcileAction = ({
    result,
    expectedAmountVnd,
    attempt,
    maxAttempts,
    lane,
}: DecideReconcileActionParams): ReconcileAction => {
    const underpaid = result.state === "paid"
        && result.reportedAmount !== undefined
        && result.reportedAmount < expectedAmountVnd
    if (result.state === "paid" && !underpaid) {
        return "finalize"
    }
    if (result.state === "terminal-unpaid") {
        return "unpaid"
    }
    const exhausted = attempt >= maxAttempts
    if (lane === "fast" && !exhausted) {
        return "fast-retry"
    }
    if (underpaid) {
        return "slow-underpaid"
    }
    return "slow-retry"
}
