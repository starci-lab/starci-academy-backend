import {
    createEnumType 
} from "@modules/common/utils"
import {
    registerEnumType 
} from "@nestjs/graphql"

/**
 * Lifecycle of a payOS checkout row before enrollment is finalized (e.g. after webhook).
 */
export enum PreflightTransactionStatus {
    Pending = "pending",
    Succeeded = "succeeded",
    Cancelled = "cancelled",
    Failed = "failed",
}

/**
 * GraphQL type for the preflight transaction status enum.
 */
export const GraphQLTypePreflightTransactionStatus = createEnumType(PreflightTransactionStatus)

/**
 * Register the preflight transaction status enum with NestJS GraphQL.
 */
registerEnumType(
    GraphQLTypePreflightTransactionStatus,
    {
        name: "PreflightTransactionStatus",
        description: "The status of a preflight transaction.",
        valuesMap: {
            [PreflightTransactionStatus.Pending]: {
                description: "The preflight transaction is pending.",
            },
            [PreflightTransactionStatus.Succeeded]: {
                description: "The preflight transaction is succeeded.",
            },
            [PreflightTransactionStatus.Failed]: {
                description: "The preflight transaction is failed.",
            },
            [PreflightTransactionStatus.Cancelled]: {
                description: "The preflight transaction is cancelled.",
            },
        },
    },
)