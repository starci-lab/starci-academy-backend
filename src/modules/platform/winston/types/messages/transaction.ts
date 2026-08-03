/** Log payload for transaction reconcile scheduling + polling. */
export interface TransactionReconcileMessage {
    /** `transactions.id` being reconciled. */
    transactionId: string
    /** 1-based attempt number for this poll. */
    attempt: number
    /** Configured max attempts before giving up as unpaid. */
    maxAttempts?: number
    /** Delay (ms) until the scheduled poll fires (scheduling log only). */
    delayMs?: number
    /** Gateway-resolved status for this poll: `paid` | `unpaid` | `unknown`. */
    status?: string
    /** Action taken: `finalize` | `unpaid` | `reenqueue` | `skip`. */
    decision?: string
    /** Number of pending transactions swept (boot-sweep log only). */
    count?: number
}
