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
 * The viewer's recent-activity stats for the rail's "this week" widget. A rolling
 * 7-day window (XP + lessons) plus an all-time consecutive-day streak — all read
 * from the user-stats projection (never computed inline at query time).
 */
@ObjectType({
    description: "Rolling 7-day activity stats (streak / XP / lessons).",
})
export class MyWeeklyStatsData {
    @Field(
        () => Int,
        {
            description: "Consecutive days (up to today) with at least one XP event.",
        },
    )
        streak: number

    @Field(
        () => Int,
        {
            description: "Total XP earned in the last 7 days.",
        },
    )
        xp: number

    @Field(
        () => Int,
        {
            description: "Number of lessons read in the last 7 days.",
        },
    )
        lessons: number
}

/**
 * Response wrapper for the myWeeklyStats query.
 */
@ObjectType({
    description: "Response wrapper for the myWeeklyStats query.",
})
export class MyWeeklyStatsResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<MyWeeklyStatsData> {
    @Field(
        () => MyWeeklyStatsData,
        {
            nullable: true,
            description: "Rolling 7-day activity stats.",
        },
    )
        data: MyWeeklyStatsData
}
