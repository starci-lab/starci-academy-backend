import {
    Field,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"
import {
    CodingProblemEntity,
    CodingLanguage,
    CodingVerdict,
    GraphQLTypeCodingLanguage,
    GraphQLTypeCodingVerdict,
} from "@modules/databases"

@ObjectType({
    description: "A target user's accepted-submission summary for one coding problem (no source code, no reference solutions).",
})
/**
 * A target user's accepted-submission summary for one coding problem, shown
 * alongside the problem detail on their public profile. Deliberately trimmed:
 * never carries `sourceCode` / `perCaseResults` / reference solutions (see
 * {@link AcceptedSubmissionSummaryResult} on the business side, which this
 * mirrors field-for-field).
 */
export class UserCodingProblemDetailSubmissionData {
    /** Every language ever accepted, not just the language of the earliest solve. */
    @Field(
        () => [GraphQLTypeCodingLanguage],
        {
            description: "Distinct languages the user solved this problem in, across all accepted attempts.",
        },
    )
        languages: Array<CodingLanguage>

    /** A constant, not a real per-submission verdict -- this object only exists for solved problems. */
    @Field(
        () => GraphQLTypeCodingVerdict,
        {
            description: "Always Accepted — this summary only exists when the user has at least one accepted attempt.",
        },
    )
        verdict: CodingVerdict

    /** Paired with totalCount from the SAME (earliest) attempt -- do not mix with a later attempt's totalCount. */
    @Field(
        () => Int,
        {
            description: "Passed-testcase count from the earliest accepted attempt.",
        },
    )
        passedCount: number

    /** Paired with passedCount from the SAME (earliest) attempt. */
    @Field(
        () => Int,
        {
            description: "Total-testcase count from the earliest accepted attempt.",
        },
    )
        totalCount: number

    /** Earliest accepted attempt's timestamp, not the latest -- do not confuse with a resubmission date. */
    @Field(
        () => Date,
        {
            description: "When the user first solved this problem.",
        },
    )
        firstSolvedAt: Date
}

@ObjectType({
    description: "A coding problem's detail plus a target user's accepted-submission summary, for the public profile.",
})
/**
 * Detail of one coding problem for a public profile's
 * `/profile/<username>/skills/<slug>` surface -- the problem itself (statement,
 * tags, sample testcases, starter codes; same read as the `codingProblem`
 * query, no ownership check) plus the TARGET user's accepted-submission
 * summary for it (null when they haven't solved it, e.g. a visitor browsing
 * an unsolved problem via the catalog).
 */
export class UserCodingProblemDetailData {
    /** Reused entity shape (never carries hidden testcases or reference solutions) -- same as `codingProblem`. */
    @Field(
        () => CodingProblemEntity,
        {
            description: "The problem detail (sample testcases only, localized) — same shape as the `codingProblem` query.",
        },
    )
        problem: CodingProblemEntity

    /** Null is a normal, expected state here (visitor browsing an unsolved problem), not an error. */
    @Field(
        () => UserCodingProblemDetailSubmissionData,
        {
            nullable: true,
            description: "The target user's accepted-submission summary for this problem, or null when unsolved.",
        },
    )
        submission: UserCodingProblemDetailSubmissionData | null
}

@ObjectType({
    description: "Response wrapper for the userCodingProblemDetail query.",
})
/**
 * Response wrapper for the userCodingProblemDetail query.
 */
export class UserCodingProblemDetailResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<UserCodingProblemDetailData> {
    /** Always present when the request succeeds -- the problem lookup itself throws on an unknown slug. */
    @Field(
        () => UserCodingProblemDetailData,
        {
            description: "The requested coding-problem detail + the target user's submission summary.",
        },
    )
        data: UserCodingProblemDetailData
}
