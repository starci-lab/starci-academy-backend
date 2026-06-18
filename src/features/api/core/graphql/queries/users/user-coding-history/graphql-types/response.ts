import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

/**
 * One solved coding problem on a user's profile — the problem, its difficulty,
 * which language(s) the user solved it in, and when it was first solved.
 */
@ObjectType({
    description: "A solved coding problem with the language(s) used.",
})
export class UserCodingHistoryItemData {
    @Field(
        () => String,
        {
            description: "Coding-problem title.",
        },
    )
        problemTitle: string

    @Field(
        () => String,
        {
            description: "Difficulty value (easy/medium/hard).",
        },
    )
        difficulty: string

    @Field(
        () => String,
        {
            description: "Problem domain value (arrays/strings/trees/dynamicProgramming/…).",
        },
    )
        domain: string

    @Field(
        () => [String],
        {
            description: "Language values the user solved it in (python/typescript/…).",
        },
    )
        languages: Array<string>

    @Field(
        () => Date,
        {
            nullable: true,
            description: "When the problem was first solved, or null.",
        },
    )
        firstSolvedAt: Date | null
}

/**
 * Response wrapper for the userCodingHistory query.
 */
@ObjectType({
    description: "Response wrapper for the userCodingHistory query.",
})
export class UserCodingHistoryResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<Array<UserCodingHistoryItemData>> {
    @Field(
        () => [UserCodingHistoryItemData],
        {
            description: "The user's solved coding problems, newest first.",
        },
    )
        data: Array<UserCodingHistoryItemData>
}
