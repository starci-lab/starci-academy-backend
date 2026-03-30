import {
    registerEnumType,
} from "@nestjs/graphql"
import {
    createEnumType,
} from "@modules/common"

/**
 * Three pricing tiers per course: Pioneer, EarlyBird, Regular.
 * Stored in the `pricing_phases.phase` column; display label is mapped by FE.
 */
export enum PricingPhase {
    Pioneer = "pioneer",
    EarlyBird = "earlybird",
    Regular = "regular",
}

/**
 * GraphQL type for the pricing phase enum.
 */
export const GraphQLTypePricingPhase = createEnumType(
    PricingPhase,
)

/**
 * Register the pricing phase enum with NestJS GraphQL.
 */
registerEnumType(
    GraphQLTypePricingPhase,
    {
        name: "PricingPhase",
        description: "Pricing tier phase for course enrollment.",
        valuesMap: {
            [PricingPhase.Pioneer]: {
                description: "Pioneer pricing tier.",
            },
            [PricingPhase.EarlyBird]: {
                description: "Early bird pricing tier.",
            },
            [PricingPhase.Regular]: {
                description: "Regular pricing tier.",
            },
        },
    },
)
