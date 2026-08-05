import {
    createEnumType,
} from "@modules/lib/common/utils/enum"
import {
    registerEnumType,
} from "@nestjs/graphql"

/**
 * Duolingo-style weekly-league tiers, lowest -> highest. Mirrors the exact string
 * values the frontend declares in `src/components/reuseable/LeagueTierBadge`.
 * A user is promoted (top 10 of a 30-person cohort) up this ladder or demoted
 * (bottom 5) down it at each weekly reset; the ends (Bronze / Legend) clamp.
 */
export enum LeagueTier {
    /** Entry tier -- every user starts here on first placement. */
    Bronze = "bronze",
    /** Second tier. */
    Silver = "silver",
    /** Third tier. */
    Gold = "gold",
    /** Fourth tier. */
    Platinum = "platinum",
    /** Fifth tier. */
    Diamond = "diamond",
    /** Sixth tier. */
    Champion = "champion",
    /** Top tier -- promotion clamps here. */
    Legend = "legend",
}

export const GraphQLTypeLeagueTier = createEnumType(LeagueTier)

registerEnumType(
    GraphQLTypeLeagueTier,
    {
        name: "LeagueTier",
        description: "Weekly-league tier (bronze → silver → gold → platinum → diamond → champion → legend).",
        valuesMap: {
            [LeagueTier.Bronze]: {
                description: "Entry tier.",
            },
            [LeagueTier.Silver]: {
                description: "Second tier.",
            },
            [LeagueTier.Gold]: {
                description: "Third tier.",
            },
            [LeagueTier.Platinum]: {
                description: "Fourth tier.",
            },
            [LeagueTier.Diamond]: {
                description: "Fifth tier.",
            },
            [LeagueTier.Champion]: {
                description: "Sixth tier.",
            },
            [LeagueTier.Legend]: {
                description: "Top tier.",
            },
        },
    },
)
