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
 * One day in the "last 7 days" streak strip (oldest → today).
 */
@ObjectType({
    description: "A day in the last-7-days streak strip.",
})
export class MyWeeklyStatsDayData {
    @Field(
        () => String,
        {
            description: "Calendar day, YYYY-MM-DD (oldest → today).",
        },
    )
        date: string

    @Field(
        () => Boolean,
        {
            description: "Whether the user earned any XP that day.",
        },
    )
        active: boolean
}

/**
 * The viewer's recent-activity stats for the streak strip. The current + longest
 * consecutive-day streaks plus the last 7 days (active flags) and rolling XP /
 * lessons — all read from the user-stats projection (never computed inline).
 */
@ObjectType({
    description: "Streak + rolling 7-day activity stats.",
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
            description: "Longest-ever consecutive-day streak.",
        },
    )
        longestStreak: number

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

    @Field(
        () => [MyWeeklyStatsDayData],
        {
            description: "The last 7 calendar days (oldest → today) with active flags.",
        },
    )
        days: Array<MyWeeklyStatsDayData>

    @Field(
        () => Int,
        {
            nullable: true,
            description: "The user's self-set weekly goal in lessons; null = no goal set.",
        },
    )
        weeklyGoalLessons: number | null

    @Field(
        () => Int,
        {
            description: "Number of unused streak freezes the user owns (0 when viewing another user).",
        },
    )
        streakFreezes: number
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
