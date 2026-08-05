/**
 * Delayed poll of a still-pending payment. `attempt` is 1-based so the worker
 * can stop after maxAttempts instead of looping forever on a stuck gateway.
 */
export interface ReconcileTransactionPayload {
    /** The ID of the pending transaction to reconcile. */
    transactionId: string
    /** 1-based attempt number for this reconcile poll (1..maxAttempts). */
    attempt: number
}
