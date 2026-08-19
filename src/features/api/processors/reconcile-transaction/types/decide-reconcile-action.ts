import type {
    ReconcileTransactionLane,
} from "@modules/integrations/bullmq/types/payloads/reconcile-transaction"
import type {
    TransactionReconcileResult,
} from "@modules/bussiness/transactions/types/transaction"

/** Inputs needed to pick the next action for one reconcile poll. */
export interface DecideReconcileActionParams {
    /** The gateway's report for the polled transaction. */
    result: TransactionReconcileResult
    /** The DB transaction's own amount, used to detect an underpaid gateway report. */
    expectedAmountVnd: number
    /** The current fast-lane attempt counter (1-based). */
    attempt: number
    /** Max fast-lane attempts before falling back to the slow lane. */
    maxAttempts: number
    /** Cadence lane this poll ran on. */
    lane: ReconcileTransactionLane
}

/** The action a reconcile poll should take next. */
export type ReconcileAction = "finalize" | "unpaid" | "fast-retry" | "slow-retry" | "slow-underpaid"
