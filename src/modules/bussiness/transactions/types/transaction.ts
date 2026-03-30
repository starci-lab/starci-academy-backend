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

/** Result for updating the status of a transaction. */
export interface UpdateTransactionStatusResult {
    transaction: TransactionEntity
}