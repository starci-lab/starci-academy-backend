import {
    registerEnumType,
} from "@nestjs/graphql"
import {
    createEnumType,
} from "@modules/common"

/**
 * Relative difficulty for a module challenge.
 * Stored in `challenges.difficulty` (nullable when unset).
 */
export enum ChallengeDifficulty {
    Easy = "easy",
    Medium = "medium",
    Hard = "hard",
    Insane = "insane",
    Expert = "expert",
}

export const GraphQLTypeChallengeDifficulty = createEnumType(
    ChallengeDifficulty,
)

registerEnumType(
    GraphQLTypeChallengeDifficulty,
    {
        name: "ChallengeDifficulty",
        description: "Difficulty tier for a challenge.",
        valuesMap: {
            [ChallengeDifficulty.Easy]: {
                description: "Easy challenge.",
            },
            [ChallengeDifficulty.Medium]: {
                description: "Medium challenge.",
            },
            [ChallengeDifficulty.Hard]: {
                description: "Hard challenge.",
            },
            [ChallengeDifficulty.Insane]: {
                description: "Insane challenge.",
            },
            [ChallengeDifficulty.Expert]: {
                description: "Expert challenge.",
            },
        },
    },
)
