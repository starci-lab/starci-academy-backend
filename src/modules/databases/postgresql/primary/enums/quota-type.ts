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
    /** Fixed total for the package lifetime — remaining quota never auto-resets. */
    Package = "package",
    /** Remaining quota resets at month start; unused units do not roll over. */
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
