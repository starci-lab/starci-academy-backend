import {
    createEnumType,
} from "@modules/common"
import {
    registerEnumType,
} from "@nestjs/graphql"

/**
 * Where a unit of COIN (spendable currency, `users.coin_balance`) was granted
 * from -- every value here is coin-only (never grants XP). Kept SEPARATE from
 * {@link XpSource} (real, weighted XP-granting events) so "XP history" and
 * "coin reward" stay two distinct concepts, not one enum straddling both.
 * Used as the `source` of an append-only {@link CoinHistoryEntity} audit row.
 */
export enum CoinSource {
    /** Coin from claiming the completed daily quest. */
    DailyQuest = "dailyQuest",
    /** Coin bonus for reaching a platform-wide streak milestone (7/30/100 consecutive days). */
    StreakMilestone = "streakMilestone",
    /** Coin bonus for keeping the streak alive on ONE calendar day, once per VN day. */
    StreakDailyBonus = "streakDailyBonus",
    /** Coin from claiming a met weekly-KPI target, scaled by the target's floor. */
    KpiReward = "kpiReward",
    /** Coin from claiming a passed weekly-challenge event, once per ISO week. */
    WeeklyChallenge = "weeklyChallenge",
}

export const GraphQLTypeCoinSource = createEnumType(CoinSource)

registerEnumType(
    GraphQLTypeCoinSource,
    {
        name: "CoinSource",
        description: "Where a unit of Coin was granted from (coin-only, never XP).",
        valuesMap: {
            [CoinSource.DailyQuest]: {
                description: "Coin from claiming the completed daily quest.",
            },
            [CoinSource.StreakMilestone]: {
                description: "Coin bonus for reaching a streak milestone.",
            },
            [CoinSource.StreakDailyBonus]: {
                description: "Coin bonus for keeping the streak alive on one calendar day.",
            },
            [CoinSource.KpiReward]: {
                description: "Coin from claiming a met weekly-KPI target.",
            },
            [CoinSource.WeeklyChallenge]: {
                description: "Coin from claiming a passed weekly-challenge event.",
            },
        },
    },
)
