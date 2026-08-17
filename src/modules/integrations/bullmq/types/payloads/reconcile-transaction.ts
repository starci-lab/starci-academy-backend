/**
 * Poll of a still-pending payment. Fast attempts are 1-based and bounded;
 * unresolved transactions then remain pending and move to the slow lane.
 */
export type ReconcileTransactionLane = "fast" | "slow"

/** Payload used by the transaction reconciliation fast and slow polling lanes. */
export interface ReconcileTransactionPayload {
    /** The ID of the pending transaction to reconcile. */
    transactionId: string
    /** 1-based fast attempt, clamped at maxAttempts while in the slow lane. */
    attempt: number
    /** Cadence lane used to distinguish checkout/webhook polling from long recovery. */
    lane?: ReconcileTransactionLane
}
