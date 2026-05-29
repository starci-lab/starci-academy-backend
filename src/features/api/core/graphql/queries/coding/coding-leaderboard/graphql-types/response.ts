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

/** One ranked user in the coding leaderboard. */
@ObjectType({
    description: "A ranked user by number of solved problems.",
})
export class CodingLeaderboardEntryObject {
    @Field(
        () => ID,
        {
            description: "The user's id.",
        },
    )
        userId: string

    @Field(
        () => String,
        {
            description: "The user's display username.",
        },
    )
        username: string

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
export class CodingLeaderboardResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<Array<CodingLeaderboardEntryObject>>
{
    @Field(
        () => [CodingLeaderboardEntryObject],
        {
            nullable: true,
            description: "Ranked users, highest solved count first.",
        },
    )
        data: Array<CodingLeaderboardEntryObject>
}
