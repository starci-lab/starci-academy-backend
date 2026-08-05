import {
    Field,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

@ObjectType({
    description: "A solved-count bucket keyed by language or difficulty value.",
})
/**
 * One bucket of solved coding problems -- a `key` (a language value like
 * "python" / "typescript", or a difficulty value like "easy" / "medium" / "hard")
 * and how many DISTINCT problems the user solved in that bucket.
 */
export class UserCodingSkillCount {
    /** Which axis this bucket belongs to (language vs. difficulty) is determined by which list it's found in, not by this value alone. */
    @Field(
        () => String,
        {
            description: "The language value (python/typescript/…) or difficulty value (easy/medium/hard).",
        },
    )
        key: string

    /** Counts distinct problems, not raw accepted submissions -- resubmitting a solved problem does not increase this. */
    @Field(
        () => Int,
        {
            description: "Number of distinct problems solved (Accepted) in this bucket.",
        },
    )
        solved: number
}

@ObjectType({
    description: "A user's solved-coding breakdown by language and by difficulty.",
})
/** A user's coding-skill breakdown: solved counts by language and by difficulty. */
export class UserCodingSkillsData {
    /** A problem solved in 2 languages counts once per language here, so the totals across buckets will not sum to the overall solved count. */
    @Field(
        () => [UserCodingSkillCount],
        {
            description: "Distinct problems solved, grouped by submission language.",
        },
    )
        byLanguage: Array<UserCodingSkillCount>

    /** Bucketed by the PROBLEM's difficulty, not the submission -- every language a problem was solved in shares one difficulty bucket entry. */
    @Field(
        () => [UserCodingSkillCount],
        {
            description: "Distinct problems solved, grouped by problem difficulty.",
        },
    )
        byDifficulty: Array<UserCodingSkillCount>

    /** Bucketed by the PROBLEM's domain, same one-entry-per-problem shape as byDifficulty. */
    @Field(
        () => [UserCodingSkillCount],
        {
            description: "Distinct problems solved, grouped by problem domain (arrays/strings/trees/…).",
        },
    )
        byDomain: Array<UserCodingSkillCount>
}

@ObjectType({
    description: "Response wrapper for the userCodingSkills query.",
})
/**
 * Response wrapper for the userCodingSkills query.
 */
export class UserCodingSkillsResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<UserCodingSkillsData> {
    /** Empty buckets (never null sub-arrays) when the user has no solves yet. */
    @Field(
        () => UserCodingSkillsData,
        {
            nullable: true,
            description: "The user's solved-coding breakdown.",
        },
    )
        data: UserCodingSkillsData
}
