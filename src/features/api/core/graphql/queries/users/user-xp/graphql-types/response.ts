import {
    Field,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

/**
 * A user's XP aggregate: the per-source XP totals derived from the `xp_histories`
 * ledger plus the two materialized balances (`total_points` / `coin_balance`).
 */
@ObjectType({
    description: "A user's XP aggregate (per-source XP + the total/reward balances).",
})
export class UserXpData {
    @Field(
        () => Int,
        {
            description: "Total XP earned from passed challenges.",
        },
    )
        challengeXp: number

    @Field(
        () => Int,
        {
            description: "Total XP earned from passed milestone tasks.",
        },
    )
        milestoneXp: number

    @Field(
        () => Int,
        {
            description: "Total XP earned from solved coding problems.",
        },
    )
        codingXp: number

    @Field(
        () => Int,
        {
            description: "Total XP earned from read lessons.",
        },
    )
        lessonXp: number

    @Field(
        () => Int,
        {
            description: "The user's total lifetime XP balance.",
        },
    )
        totalPoints: number

    @Field(
        () => Int,
        {
            description: "The user's spendable Coin balance.",
        },
    )
        coinBalance: number
}

/**
 * Response wrapper for the userXp query.
 *
 * The named user's XP aggregate — per-source XP figures summed from the
 * `xp_histories` ledger, plus the total-XP and spendable Coin balances.
 */
@ObjectType({
    description: "Response wrapper for the userXp query.",
})
export class UserXpResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<UserXpData> {
    @Field(
        () => UserXpData,
        {
            nullable: true,
            description: "The user's XP aggregate.",
        },
    )
        data: UserXpData
}
