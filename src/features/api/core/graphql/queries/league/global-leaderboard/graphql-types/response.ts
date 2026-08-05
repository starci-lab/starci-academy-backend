import {
    Field,
    ID,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

@ObjectType({
    description: "A ranked user on the global points leaderboard.",
})
/**
 * One ranked user on the global (all-users) leaderboard, ordered by total
 * reward points.
 */
export class GlobalLeaderboardEntryData {
    @Field(
        () => ID,
        {
            description: "Opaque global id of the user.",
        },
    )
        userGlobalId: string

    @Field(
        () => String,
        {
            nullable: true,
            description: "User's display username (null when unset).",
        },
    )
        username: string | null

    @Field(
        () => String,
        {
            nullable: true,
            description: "User's avatar URL (null when unset).",
        },
    )
        avatar: string | null

    @Field(
        () => Int,
        {
            description: "The user's unified global points balance.",
        },
    )
        points: number

    @Field(
        () => Int,
        {
            description: "1-based rank across all users (descending by points).",
        },
    )
        rank: number
}

@ObjectType({
    description: "The global points leaderboard (top users + the viewer's own standing).",
})
/**
 * The viewer's view of the global leaderboard: the top-ranked users plus the
 * viewer's own rank + points (so the UI can append a "you" row when the viewer
 * sits outside the visible top).
 */
export class GlobalLeaderboardData {
    @Field(
        () => [GlobalLeaderboardEntryData],
        {
            description: "Top-ranked users, best → worst.",
        },
    )
        entries: Array<GlobalLeaderboardEntryData>

    @Field(
        () => Int,
        {
            description: "The viewer's own 1-based rank across all users.",
        },
    )
        myRank: number

    @Field(
        () => Int,
        {
            description: "The viewer's unified global points balance.",
        },
    )
        myPoints: number
}

@ObjectType({
    description: "Response wrapper for the globalLeaderboard query.",
})
/**
 * Response wrapper for the globalLeaderboard query.
 */
export class GlobalLeaderboardResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<GlobalLeaderboardData> {
    @Field(
        () => GlobalLeaderboardData,
        {
            nullable: true,
            description: "The global points leaderboard.",
        },
    )
        data: GlobalLeaderboardData
}
