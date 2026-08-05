import {
    registerEnumType,
} from "@nestjs/graphql"
import {
    createEnumType,
} from "@modules/lib/common/utils/enum"

/**
 * Difficulty tier for a LeetCode-style coding problem.
 * Stored in `coding_problems.difficulty`.
 */
export enum CodingDifficulty {
    /** Beginner-friendly problem -- basic data structures / straightforward logic. */
    Easy = "easy",
    /** Intermediate problem -- non-trivial algorithm or edge-case handling. */
    Medium = "medium",
    /** Advanced problem -- optimal algorithm / tight complexity bounds required. */
    Hard = "hard",
}

/** GraphQL enum wrapper for {@link CodingDifficulty}. */
export const GraphQLTypeCodingDifficulty = createEnumType(CodingDifficulty)

registerEnumType(
    GraphQLTypeCodingDifficulty,
    {
        name: "CodingDifficulty",
        description: "Difficulty tier for a coding-practice problem.",
        valuesMap: {
            [CodingDifficulty.Easy]: {
                description: "Easy problem.",
            },
            [CodingDifficulty.Medium]: {
                description: "Medium problem.",
            },
            [CodingDifficulty.Hard]: {
                description: "Hard problem.",
            },
        },
    },
)
