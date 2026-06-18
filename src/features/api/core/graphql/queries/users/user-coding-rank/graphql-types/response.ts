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
 * A user's DERIVED coding standing — a 1-based global rank + a percentile by
 * distinct solved coding problems (same ordering as the coding leaderboard:
 * solvedCount DESC, tie-break updated_at ASC). Purely derived. Both fields are
 * null when the user has 0 solves (unranked).
 */
@ObjectType({
    description: "A user's derived coding rank + percentile by distinct solved problems.",
})
export class CodingRankObject {
    @Field(
        () => Int,
        {
            nullable: true,
            description: "The user's 1-based global coding rank, or null when they have 0 solves.",
        },
    )
        rank: number | null

    @Field(
        () => Int,
        {
            nullable: true,
            description: "0-100 percentile of users this user's solved count beats, or null when they have 0 solves.",
        },
    )
        percentile: number | null
}

/**
 * Response wrapper for the userCodingRank query.
 *
 * Carries the derived coding standing ({@link CodingRankObject}), nullable when
 * the user has 0 solves (unranked).
 */
@ObjectType({
    description: "Response wrapper for the userCodingRank query.",
})
export class UserCodingRankResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<CodingRankObject | null> {
    @Field(
        () => CodingRankObject,
        {
            nullable: true,
            description: "The user's derived coding rank + percentile by distinct solved problems.",
        },
    )
        data: CodingRankObject | null
}
