import {
    createEnumType 
} from "@modules/common/utils"
import {
    registerEnumType 
} from "@nestjs/graphql"

/**
 * Type of quota applied to a payment gateway.
 */
export enum QuotaType {
    Package = "package",
    Monthly = "monthly",
}

/**
 * GraphQL type for the quota type enum.
 */
export const GraphQLTypeQuotaType = createEnumType(QuotaType)

/**
 * Register the quota type enum with NestJS GraphQL.
 */
registerEnumType(
    GraphQLTypeQuotaType,
    {
        name: "QuotaType",
        description: "The type of quota applied to a payment gateway.",
        valuesMap: {
            [QuotaType.Package]: {
                description: "Quota is based on a fixed package limit.",
            },
            [QuotaType.Monthly]: {
                description: "Quota resets at the beginning of each month.",
            },
        },
    },
)
