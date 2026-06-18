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
 * A user's DERIVED challenge-strength standing — a percentile + 1-based global
 * rank by a difficulty-weighted sum of their distinct passed challenges. Purely
 * derived: it does NOT touch the points / XP / league economy. Both fields are
 * null when the user has no passes (unranked).
 */
@ObjectType({
    description: "A user's derived challenge-strength percentile + global rank.",
})
export class ChallengeStrengthObject {
    @Field(
        () => Int,
        {
            nullable: true,
            description: "0-100 percentile of users this user's strength score beats, or null when they have no passes.",
        },
    )
        percentile: number | null

    @Field(
        () => Int,
        {
            nullable: true,
            description: "The user's 1-based global challenge-strength rank, or null when they have no passes.",
        },
    )
        rank: number | null

    @Field(
        () => Int,
        {
            description: "Total XP earned from challenges (sum of ledger amounts for the Challenge source); 0 when none.",
        },
    )
        xp: number
}

/**
 * Response wrapper for the userChallengeStrength query.
 *
 * Carries the derived challenge-strength standing ({@link ChallengeStrengthObject}),
 * nullable when the user has no passes (unranked).
 */
@ObjectType({
    description: "Response wrapper for the userChallengeStrength query.",
})
export class UserChallengeStrengthResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<ChallengeStrengthObject | null> {
    @Field(
        () => ChallengeStrengthObject,
        {
            nullable: true,
            description: "The user's derived challenge-strength percentile + global rank.",
        },
    )
        data: ChallengeStrengthObject | null
}
