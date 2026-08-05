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
    /** Catalog + junior mock-interview design draws; lowest expected effort. */
    Easy = "easy",
    /** Catalog filter; default when a prompt/task omits difficulty; middle interview draws. */
    Medium = "medium",
    /** Catalog filter; senior mock-interview design draws (with Insane). */
    Hard = "hard",
    /** Catalog filter; senior mock-interview design draws (with Hard). */
    Insane = "insane",
    /** Top catalog badge -- mock-interview design mode never draws Expert prompts. */
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
