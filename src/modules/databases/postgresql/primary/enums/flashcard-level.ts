import {
    registerEnumType,
} from "@nestjs/graphql"
import {
    createEnumType,
} from "@modules/lib/common/utils/enum"

/**
 * Interview seniority level a flashcard targets.
 * Stored per-card in `flashcard_cards.level` (a deck mixes levels).
 */
export enum FlashcardLevel {
    /** Recall / basics -- drawn only into junior mock-interview QnA sessions. */
    Junior = "junior",
    /** Applied practice -- drawn into middle QnA; default when a card omits level. */
    Middle = "middle",
    /** Tradeoffs / design -- drawn into senior QnA (with Staff). */
    Senior = "senior",
    /** Systemic / ambiguous -- folded into senior QnA so advanced pools stay non-empty. */
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
