export interface ReconcileTransactionPayload {
    /** The ID of the pending transaction to reconcile. */
    transactionId: string
    /** 1-based attempt number for this reconcile poll (1..maxAttempts). */
    attempt: number
}
