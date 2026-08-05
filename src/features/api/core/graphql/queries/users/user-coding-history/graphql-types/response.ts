import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

@ObjectType({
    description: "A solved coding problem with the language(s) used.",
})
/**
 * One solved coding problem on a user's profile -- the problem, its difficulty,
 * which language(s) the user solved it in, and when it was first solved.
 */
export class UserCodingHistoryItemData {
    /** Display title shown for the problem entry. */
    @Field(
        () => String,
        {
            description: "Coding-problem title.",
        },
    )
        problemTitle: string

    /** Drives the click-through link to the problem's detail view on this profile. */
    @Field(
        () => String,
        {
            description: "Stable URL slug of the problem (drives `/profile/<username>/skills/<slug>`).",
        },
    )
        slug: string

    /** Raw difficulty value, for the caller to localize/style (not pre-translated here). */
    @Field(
        () => String,
        {
            description: "Difficulty value (easy/medium/hard).",
        },
    )
        difficulty: string

    /** Raw domain value, for grouping/filtering client-side. */
    @Field(
        () => String,
        {
            description: "Problem domain value (arrays/strings/trees/dynamicProgramming/…).",
        },
    )
        domain: string

    /** Every language the user was ever accepted in for this problem, not just the latest. */
    @Field(
        () => [String],
        {
            description: "Language values the user solved it in (python/typescript/…).",
        },
    )
        languages: Array<string>

    /** Nullable defensively; every entry in this list is already a solve, so this is effectively always set. */
    @Field(
        () => Date,
        {
            nullable: true,
            description: "When the problem was first solved, or null.",
        },
    )
        firstSolvedAt: Date | null
}

@ObjectType({
    description: "Response wrapper for the userCodingHistory query.",
})
/**
 * Response wrapper for the userCodingHistory query.
 */
export class UserCodingHistoryResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<Array<UserCodingHistoryItemData>> {
    /** Empty array (never null) when the user has no solves yet. */
    @Field(
        () => [UserCodingHistoryItemData],
        {
            description: "The user's solved coding problems, newest first.",
        },
    )
        data: Array<UserCodingHistoryItemData>
}
