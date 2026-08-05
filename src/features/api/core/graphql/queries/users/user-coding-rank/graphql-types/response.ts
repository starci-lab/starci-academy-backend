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
    description: "A user's derived coding rank + percentile by distinct solved problems.",
})
/**
 * A user's DERIVED coding standing -- a 1-based global rank + a percentile by
 * distinct solved coding problems (same ordering as the coding leaderboard:
 * solvedCount DESC, tie-break updated_at ASC). Purely derived. Both fields are
 * null when the user has 0 solves (unranked).
 */
export class CodingRankObject {
    /** 1 is the top solver; null (not 0) signals unranked -- do not render null as rank 0. */
    @Field(
        () => Int,
        {
            nullable: true,
            description: "The user's 1-based global coding rank, or null when they have 0 solves.",
        },
    )
        rank: number | null

    /** Always paired with rank; null under the same unranked condition. */
    @Field(
        () => Int,
        {
            nullable: true,
            description: "0-100 percentile of users this user's solved count beats, or null when they have 0 solves.",
        },
    )
        percentile: number | null
}

@ObjectType({
    description: "Response wrapper for the userCodingRank query.",
})
/**
 * Response wrapper for the userCodingRank query.
 *
 * Carries the derived coding standing ({@link CodingRankObject}), nullable when
 * the user has 0 solves (unranked).
 */
export class UserCodingRankResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<CodingRankObject | null> {
    /** In practice always an object -- unranked is represented by its own rank/percentile fields being null, not this field. */
    @Field(
        () => CodingRankObject,
        {
            nullable: true,
            description: "The user's derived coding rank + percentile by distinct solved problems.",
        },
    )
        data: CodingRankObject | null
}
