import type {
    AiExecutionError,
} from "./execution-errors"

/** Successful result of one bounded reconciliation sweep. */
export interface ReconcileExpiredExecutionsSuccess {
    reconciledExecutionIds: Array<string>
}

/** Result of one bounded reconciliation sweep. */
export type ReconcileExpiredExecutionsResult = ReconcileExpiredExecutionsSuccess | {
    error: AiExecutionError
}
