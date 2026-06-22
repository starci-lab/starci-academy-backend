import {
    TransactionEntity,
    TransactionStatus,
} from "@modules/databases"
import type {
    EntityManager,
} from "typeorm"

/** Params for updating the status of a transaction. */
export interface UpdateTransactionStatusParams {
    id: string
    status: TransactionStatus
    entityManager?: EntityManager
}

/** Params for a guarded status update (only applies while `expectedStatus` holds). */
export interface UpdateTransactionStatusIfExpectedParams {
    id: string
    status: TransactionStatus
    expectedStatus: TransactionStatus
    entityManager?: EntityManager
}

/** Result for updating the status of a transaction. */
export interface UpdateTransactionStatusResult {
    transaction: TransactionEntity
}

/**
 * Outcome of polling a payment gateway for a pending transaction:
 * - `paid` — gateway confirms payment → finalize (enroll / grant tier).
 * - `unpaid` — gateway confirms a terminal non-paid state (cancelled/expired/voided).
 * - `unknown` — still pending or undeterminable → keep polling until attempts run out.
 */
export type TransactionReconcileStatus = "paid" | "unpaid" | "unknown"