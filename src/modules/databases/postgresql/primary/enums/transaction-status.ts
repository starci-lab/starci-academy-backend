import {
    createEnumType 
} from "@modules/common/utils"
import {
    registerEnumType 
} from "@nestjs/graphql"

/**
 * Lifecycle of a payOS checkout row before enrollment is finalized (e.g. after webhook).
 */
export enum TransactionStatus {
    Pending = "pending",
    Succeeded = "succeeded",
    Cancelled = "cancelled",
    Failed = "failed",
    Unpaid = "unpaid",
}

/**
 * GraphQL type for the preflight transaction status enum.
 */
export const GraphQLTypeTransactionStatus = createEnumType(TransactionStatus)

/**
 * Register the preflight transaction status enum with NestJS GraphQL.
 */
registerEnumType(
    GraphQLTypeTransactionStatus,
    {
        name: "TransactionStatus",
        description: "The status of a transaction.",
        valuesMap: {
            [TransactionStatus.Pending]: {
                description: "The transaction is pending.",
            },
            [TransactionStatus.Succeeded]: {
                description: "The transaction is succeeded.",
            },
            [TransactionStatus.Failed]: {
                description: "The transaction is failed.",
            },
            [TransactionStatus.Cancelled]: {
                description: "The transaction is cancelled.",
            },
            [TransactionStatus.Unpaid]: {
                description: "The transaction stayed pending past the reconcile window and was never paid.",
            },
        },
    },
)