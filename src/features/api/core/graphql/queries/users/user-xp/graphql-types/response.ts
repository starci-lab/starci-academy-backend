import {
    Field,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

@ObjectType({
    description: "A user's XP aggregate (per-source XP + the total/reward balances).",
})
/**
 * A user's XP aggregate: every XP figure (per-source totals + the global
 * `totalPoints`) is derived live from the `xp_histories` ledger; `coinBalance`
 * is the one materialized balance (`users.coin_balance`).
 */
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

@ObjectType({
    description: "Response wrapper for the userXp query.",
})
/**
 * Response wrapper for the userXp query.
 *
 * The named user's XP aggregate -- per-source XP figures summed from the
 * `xp_histories` ledger, plus the total-XP and spendable Coin balances.
 */
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
