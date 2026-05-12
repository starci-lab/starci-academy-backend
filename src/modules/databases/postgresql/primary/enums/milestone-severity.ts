import {
    createEnumType,
} from "@modules/common"
import {
    registerEnumType 
} from "@nestjs/graphql"

/**
 * Severity of a milestone task attempt feedback item.
 */
export enum MilestoneSeverity {
    /**
     * Low severity.
     */
    Low = "low",
    /**
     * Medium severity.
     */
    Medium = "medium",
    /**
     * High severity.
     */
    High = "high",
}

/**
 * GraphQL type for the milestone severity enum.
 */
export const GraphQLTypeMilestoneSeverity = createEnumType(
    MilestoneSeverity,
)

/**
 * Register the milestone severity enum with NestJS GraphQL.
 */
registerEnumType(
    GraphQLTypeMilestoneSeverity,
    {
        name: "MilestoneSeverity",
        description: "Severity of a milestone task attempt feedback item.",
        valuesMap: {
            [MilestoneSeverity.Low]: {
                description: "Low severity.",
            },
            [MilestoneSeverity.Medium]: {
                description: "Medium severity.",
            },
            [MilestoneSeverity.High]: {
                description: "High severity.",
            },
        },
    })
