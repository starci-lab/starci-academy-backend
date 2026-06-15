import {
    LeagueTier,
} from "@modules/databases"

/**
 * The league tiers in ascending order (lowest → highest). The array INDEX is the
 * ladder position, so promotion is "index + 1" and demotion is "index - 1",
 * clamped at the ends. Single source of truth for promote/demote math.
 */
export const LEAGUE_TIER_ORDER: ReadonlyArray<LeagueTier> = [
    LeagueTier.Bronze,
    LeagueTier.Silver,
    LeagueTier.Gold,
    LeagueTier.Platinum,
    LeagueTier.Diamond,
    LeagueTier.Champion,
    LeagueTier.Legend,
]
