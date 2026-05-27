import {
    createEnumType,
} from "@modules/common/utils/enum"
import {
    registerEnumType,
} from "@nestjs/graphql"

/**
 * AI subscription tier — bumps weekly/5h credit caps on top of
 * the base contribution from each enrollment.
 *
 * Pricing (VND/month):
 * - Plus: 99_000
 * - Pro:  199_000  ⭐ most popular
 * - Max:  499_000
 *
 * Caps (additive with course enrollments):
 * - Plus: +250 credits/5h, +2500 credits/week
 * - Pro:  +500 credits/5h, +5000 credits/week
 * - Max: +2000 credits/5h, +20000 credits/week
 */
export enum AiSubTier {
    Plus = "plus",
    Pro = "pro",
    Max = "max",
}

export const GraphQLTypeAiSubTier = createEnumType(AiSubTier)

registerEnumType(
    GraphQLTypeAiSubTier,
    {
        name: "AiSubTier",
        description: "AI subscription tier (Plus/Pro/Max).",
        valuesMap: {
            [AiSubTier.Plus]: {
                description: "Entry-level AI subscription (+250/5h, +2500/week).",
            },
            [AiSubTier.Pro]: {
                description: "Most popular AI subscription (+500/5h, +5000/week).",
            },
            [AiSubTier.Max]: {
                description: "Power user AI subscription (+2000/5h, +20000/week).",
            },
        },
    },
)
