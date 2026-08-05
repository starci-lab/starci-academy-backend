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
    description: "A ranked user by number of solved problems.",
})
/** One ranked user in the coding leaderboard. */
export class CodingLeaderboardEntryObject {
    /** The user's id. */
    @Field(
        () => ID,
        {
            description: "The user's id.",
        },
    )
        userId: string

    /** The user's display username. */
    @Field(
        () => String,
        {
            description: "The user's display username.",
        },
    )
        username: string

    /** Number of distinct problems the user has solved. */
    @Field(
        () => Int,
        {
            description: "Number of distinct problems the user has solved.",
        },
    )
        solvedCount: number
}

@ObjectType({
    description: "Response wrapper for the codingLeaderboard query.",
})
/** Response wrapper for the codingLeaderboard query. */
export class CodingLeaderboardResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<Array<CodingLeaderboardEntryObject>>
{
    /** Ranked users, highest solved count first. */
    @Field(
        () => [CodingLeaderboardEntryObject],
        {
            nullable: true,
            description: "Ranked users, highest solved count first.",
        },
    )
        data: Array<CodingLeaderboardEntryObject>
}
