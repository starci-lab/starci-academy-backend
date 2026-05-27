import {
    Field,
    ID,
    InputType,
    Int,
} from "@nestjs/graphql"

/** Default page size when the caller does not specify a limit. */
const DEFAULT_LIMIT = 50
/** Hard cap on returned entries (matches cached window). */
const MAX_LIMIT = 100

@InputType({
    description: "Request for fetching the leaderboard of a course.",
})
export class LeaderboardRequest {
    @Field(
        () => ID,
        {
            description: "Course ID to fetch the leaderboard for.",
        },
    )
        courseId: string

    @Field(
        () => Int,
        {
            nullable: true,
            description:
                `Number of top entries to return (1..${MAX_LIMIT}). Defaults to ${DEFAULT_LIMIT}.`,
        },
    )
        limit?: number
}

export const LeaderboardRequestDefaults = {
    DEFAULT_LIMIT,
    MAX_LIMIT,
}
