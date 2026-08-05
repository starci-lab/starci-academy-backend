import {
    Field,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
} from "@modules/api/apollo/server/graphql-types/object-types/graphql-response"
import {
    IAbstractGraphQLResponse,
} from "@modules/api/apollo/server/types/graphql-response"

@ObjectType({
    description: "Single entry on the course leaderboard.",
})
/**
 * One ranked enrollment in the cached top window. Rank is 1-based; `totalXp`
 * is the sort metric (challenge score + readsx3 + milestonex10).
 */
export class LeaderboardEntryData {
    @Field(
        () => Int,
        {
            description: "1-based rank position within the leaderboard window.",
        },
    )
        rank: number

    @Field(
        () => String,
        {
            description: "Enrollment ID.",
        },
    )
        enrollmentId: string

    @Field(
        () => String,
        {
            description: "User ID.",
        },
    )
        userId: string

    @Field(
        () => String,
        {
            nullable: true,
            description: "Username snapshot for display.",
        },
    )
        username: string | null

    @Field(
        () => String,
        {
            nullable: true,
            description: "Avatar URL snapshot.",
        },
    )
        avatar: string | null

    @Field(
        () => Int,
        {
            description: "Total score across all challenges in the course.",
        },
    )
        totalScore: number

    @Field(
        () => Int,
        {
            description: "Number of fully-completed challenges.",
        },
    )
        completedChallenges: number

    @Field(
        () => Int,
        {
            description: "Number of lessons the user marked read in the course.",
        },
    )
        lessonsRead: number

    @Field(
        () => Int,
        {
            description: "Number of milestone tasks passed in the course.",
        },
    )
        milestoneProgress: number

    @Field(
        () => Int,
        {
            description: "Total XP (challenge + reads×3 + milestone×10) — the rank metric.",
        },
    )
        totalXp: number
}

@ObjectType({
    description: "Current viewer's standing within the leaderboard (even when outside the top window).",
})
/**
 * Viewer's standing across the whole course -- returned even when they fall
 * outside the top-N window. Null on the parent when they have no scored attempts.
 */
export class LeaderboardMyRankData {
    @Field(
        () => Int,
        {
            description: "1-based rank of the current user across the whole course.",
        },
    )
        rank: number

    @Field(
        () => Int,
        {
            description: "Total challenge score for the current user.",
        },
    )
        totalScore: number

    @Field(
        () => Int,
        {
            description: "Number of fully-completed challenges for the current user.",
        },
    )
        completedChallenges: number

    @Field(
        () => Int,
        {
            description: "Number of lessons the current user marked read in the course.",
        },
    )
        lessonsRead: number

    @Field(
        () => Int,
        {
            description: "Number of milestone tasks the current user passed in the course.",
        },
    )
        milestoneProgress: number

    @Field(
        () => Int,
        {
            description: "Total XP for the current user (challenge + reads×3 + milestone×10).",
        },
    )
        totalXp: number
}

@ObjectType({
    description: "Leaderboard payload for a course.",
})
/**
 * Cached course leaderboard snapshot: top entries, course totals, and optional
 * `myRank`. `computedAt` is when the projection last recomputed, not request time.
 */
export class LeaderboardResponseData {
    @Field(
        () => String,
        {
            description: "Course ID this leaderboard belongs to.",
        },
    )
        courseId: string

    @Field(
        () => Int,
        {
            description: "Total challenges in the course.",
        },
    )
        totalChallenges: number

    @Field(
        () => Int,
        {
            description: "Maximum possible total score for the course.",
        },
    )
        maxPossibleScore: number

    @Field(
        () => [LeaderboardEntryData],
        {
            description: "Top entries sorted by totalXp DESC then enrollment createdAt ASC.",
        },
    )
        entries: Array<LeaderboardEntryData>

    @Field(
        () => LeaderboardMyRankData,
        {
            nullable: true,
            description:
                "Current viewer's rank — null when the viewer has no scored attempts on this course.",
        },
    )
        myRank: LeaderboardMyRankData | null

    @Field(
        () => Date,
        {
            description: "When this leaderboard snapshot was computed.",
        },
    )
        computedAt: Date
}

@ObjectType({
    description: "Response wrapper for the leaderboard query.",
})
/**
 * Envelope for `courseLeaderboard`. The snapshot itself is in `data`.
 */
export class LeaderboardResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<LeaderboardResponseData>
{
    @Field(
        () => LeaderboardResponseData,
        {
            nullable: true,
            description: "Leaderboard payload.",
        },
    )
        data: LeaderboardResponseData
}
