import {
    Field,
    InputType,
    Int,
} from "@nestjs/graphql"

@InputType({
    description: "Coding leaderboard parameters.",
})
/** Request for the coding leaderboard. */
export class CodingLeaderboardRequest {
    /** Max number of ranked users to return (default 50). */
    @Field(
        () => Int,
        {
            nullable: true,
            description: "Max number of ranked users to return (default 50).",
        },
    )
        limit?: number
}
