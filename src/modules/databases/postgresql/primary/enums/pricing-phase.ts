import {
    registerEnumType,
} from "@nestjs/graphql"
import {
    createEnumType,
} from "@modules/lib/common/utils/enum"

/**
 * Three pricing tiers per course: Pioneer, EarlyBird, Regular.
 * Stored in the `pricing_phases.phase` column; display label is mapped by FE.
 */
export enum PricingPhase {
    /** Launch price -- cheapest; `nextPricingPhase` advances this to EarlyBird. */
    Pioneer = "pioneer",
    /** Mid-tier price; default when `metadata.currentPhase` is unset. */
    EarlyBird = "earlyBird",
    /** Terminal full price -- `nextPricingPhase` stays here; also the snapshot for non-course purchases. */
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

/**
 * Get the next pricing phase of a course.
 */
export const nextPricingPhase = (
    currentPhase: PricingPhase,
): PricingPhase => {
    switch (currentPhase) {
    // Pioneer -> EarlyBird
    case PricingPhase.Pioneer: {
        return PricingPhase.EarlyBird
    }
    // EarlyBird -> Regular
    case PricingPhase.EarlyBird: {
        return PricingPhase.Regular
    }
    // Regular -> Regular
    default: {
        return PricingPhase.Regular
    }
    }
}