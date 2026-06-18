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
 * One bucket of solved coding problems — a `key` (a language value like
 * "python" / "typescript", or a difficulty value like "easy" / "medium" / "hard")
 * and how many DISTINCT problems the user solved in that bucket.
 */
@ObjectType({
    description: "A solved-count bucket keyed by language or difficulty value.",
})
export class UserCodingSkillCount {
    @Field(
        () => String,
        {
            description: "The language value (python/typescript/…) or difficulty value (easy/medium/hard).",
        },
    )
        key: string

    @Field(
        () => Int,
        {
            description: "Number of distinct problems solved (Accepted) in this bucket.",
        },
    )
        solved: number
}

/** A user's coding-skill breakdown: solved counts by language and by difficulty. */
@ObjectType({
    description: "A user's solved-coding breakdown by language and by difficulty.",
})
export class UserCodingSkillsData {
    @Field(
        () => [UserCodingSkillCount],
        {
            description: "Distinct problems solved, grouped by submission language.",
        },
    )
        byLanguage: Array<UserCodingSkillCount>

    @Field(
        () => [UserCodingSkillCount],
        {
            description: "Distinct problems solved, grouped by problem difficulty.",
        },
    )
        byDifficulty: Array<UserCodingSkillCount>

    @Field(
        () => [UserCodingSkillCount],
        {
            description: "Distinct problems solved, grouped by problem domain (arrays/strings/trees/…).",
        },
    )
        byDomain: Array<UserCodingSkillCount>
}

/**
 * Response wrapper for the userCodingSkills query.
 */
@ObjectType({
    description: "Response wrapper for the userCodingSkills query.",
})
export class UserCodingSkillsResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<UserCodingSkillsData> {
    @Field(
        () => UserCodingSkillsData,
        {
            nullable: true,
            description: "The user's solved-coding breakdown.",
        },
    )
        data: UserCodingSkillsData
}
