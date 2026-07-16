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

/**
 * A target user's accepted-submission summary for one coding problem, shown
 * alongside the problem detail on their public profile. Deliberately trimmed:
 * never carries `sourceCode` / `perCaseResults` / reference solutions (see
 * {@link AcceptedSubmissionSummaryResult} on the business side, which this
 * mirrors field-for-field).
 */
@ObjectType({
    description: "A target user's accepted-submission summary for one coding problem (no source code, no reference solutions).",
})
export class UserCodingProblemDetailSubmissionData {
    @Field(
        () => [GraphQLTypeCodingLanguage],
        {
            description: "Distinct languages the user solved this problem in, across all accepted attempts.",
        },
    )
        languages: Array<CodingLanguage>

    @Field(
        () => GraphQLTypeCodingVerdict,
        {
            description: "Always Accepted — this summary only exists when the user has at least one accepted attempt.",
        },
    )
        verdict: CodingVerdict

    @Field(
        () => Int,
        {
            description: "Passed-testcase count from the earliest accepted attempt.",
        },
    )
        passedCount: number

    @Field(
        () => Int,
        {
            description: "Total-testcase count from the earliest accepted attempt.",
        },
    )
        totalCount: number

    @Field(
        () => Date,
        {
            description: "When the user first solved this problem.",
        },
    )
        firstSolvedAt: Date
}

/**
 * Detail of one coding problem for a public profile's
 * `/profile/<username>/skills/<slug>` surface — the problem itself (statement,
 * tags, sample testcases, starter codes; same read as the `codingProblem`
 * query, no ownership check) plus the TARGET user's accepted-submission
 * summary for it (null when they haven't solved it, e.g. a visitor browsing
 * an unsolved problem via the catalog).
 */
@ObjectType({
    description: "A coding problem's detail plus a target user's accepted-submission summary, for the public profile.",
})
export class UserCodingProblemDetailData {
    @Field(
        () => CodingProblemEntity,
        {
            description: "The problem detail (sample testcases only, localized) — same shape as the `codingProblem` query.",
        },
    )
        problem: CodingProblemEntity

    @Field(
        () => UserCodingProblemDetailSubmissionData,
        {
            nullable: true,
            description: "The target user's accepted-submission summary for this problem, or null when unsolved.",
        },
    )
        submission: UserCodingProblemDetailSubmissionData | null
}

/**
 * Response wrapper for the userCodingProblemDetail query.
 */
@ObjectType({
    description: "Response wrapper for the userCodingProblemDetail query.",
})
export class UserCodingProblemDetailResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<UserCodingProblemDetailData> {
    @Field(
        () => UserCodingProblemDetailData,
        {
            description: "The requested coding-problem detail + the target user's submission summary.",
        },
    )
        data: UserCodingProblemDetailData
}
