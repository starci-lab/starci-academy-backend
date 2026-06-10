import {
    registerEnumType,
} from "@nestjs/graphql"
import {
    createEnumType,
} from "@modules/common"

/**
 * Interview seniority level a flashcard targets.
 * Stored per-card in `flashcard_cards.level` (a deck mixes levels).
 */
export enum FlashcardLevel {
    Junior = "junior",
    Middle = "middle",
    Senior = "senior",
    Staff = "staff",
}

export const GraphQLTypeFlashcardLevel = createEnumType(
    FlashcardLevel,
)

registerEnumType(
    GraphQLTypeFlashcardLevel,
    {
        name: "FlashcardLevel",
        description: "Interview seniority level a flashcard targets.",
        valuesMap: {
            [FlashcardLevel.Junior]: {
                description: "Junior — recall + basic mechanics.",
            },
            [FlashcardLevel.Middle]: {
                description: "Middle — applies concepts in practice.",
            },
            [FlashcardLevel.Senior]: {
                description: "Senior — tradeoffs, design, failure modes.",
            },
            [FlashcardLevel.Staff]: {
                description: "Staff / Solution Architect — systemic, ambiguous, cross-cutting.",
            },
        },
    },
)
