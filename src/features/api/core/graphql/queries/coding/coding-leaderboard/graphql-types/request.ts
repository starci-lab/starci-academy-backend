import {
    Field,
    InputType,
    Int,
} from "@nestjs/graphql"

/** Request for the coding leaderboard. */
@InputType({
    description: "Coding leaderboard parameters.",
})
export class CodingLeaderboardRequest {
    @Field(
        () => Int,
        {
            nullable: true,
            description: "Max number of ranked users to return (default 50).",
        },
    )
        limit?: number
}
