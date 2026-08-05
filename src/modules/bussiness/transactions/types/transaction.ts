import {
    TransactionEntity,
    TransactionStatus,
} from "@modules/databases"
import type {
    EntityManager,
} from "typeorm"

/** Params for updating the status of a transaction. */
export interface UpdateTransactionStatusParams {
    /** The transaction id to update. */
    id: string
    /** The status to write. */
    status: TransactionStatus
    /** Optional transactional entity manager; falls back to the primary one when omitted. */
    entityManager?: EntityManager
}

/** Params for a guarded status update (only applies while `expectedStatus` holds). */
export interface UpdateTransactionStatusIfExpectedParams {
    /** The transaction id to update. */
    id: string
    /** The status to write when the guard matches. */
    status: TransactionStatus
    /** The row must currently be in this status, or the update is skipped (returns `false`). */
    expectedStatus: TransactionStatus
    /** Optional transactional entity manager; falls back to the primary one when omitted. */
    entityManager?: EntityManager
}

/** Result for updating the status of a transaction. */
export interface UpdateTransactionStatusResult {
    /** The transaction after the update. */
    transaction: TransactionEntity
}

/**
 * Outcome of polling a payment gateway for a pending transaction:
 * - `paid` -- gateway confirms payment -> finalize (enroll / grant tier).
 * - `unpaid` -- gateway confirms a terminal non-paid state (cancelled/expired/voided).
 * - `unknown` -- still pending or undeterminable -> keep polling until attempts run out.
 */
export type TransactionReconcileStatus = "paid" | "unpaid" | "unknown"