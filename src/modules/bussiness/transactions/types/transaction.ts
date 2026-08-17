import {
    TransactionEntity,
} from "@modules/databases/postgresql/primary/entities/transaction.entity"
import {
    TransactionStatus,
} from "@modules/databases/postgresql/primary/enums/transaction-status"
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
 * Provider-authoritative outcome for a pending transaction. `pending` means
 * the provider answered and the payment is still open; `unavailable` means no
 * trustworthy answer was obtained and must never be converted into `Unpaid`.
 */
export type TransactionReconcileResult =
    | {
        state: "paid"
        providerStatus: string
        reportedAmount?: number
    }
    | {
        state: "terminal-unpaid"
        providerStatus: string
    }
    | {
        state: "pending"
        providerStatus: string
    }
    | {
        state: "unavailable"
        reason: "missing-provider-id" | "unsupported-provider" | "provider-error" | "invalid-response"
    }
