import {
    registerEnumType,
} from "@nestjs/graphql"
import {
    createEnumType,
} from "@modules/common"

/**
 * Relative difficulty for a content (lesson).
 * Stored in `contents.difficulty` (nullable when unset). Mirrors the module-level
 * content tier so a lesson can carry its own granular difficulty badge.
 */
export enum ContentDifficulty {
    /** Lesson badge / catalog filter only — first-pass material; never gates access. */
    Beginner = "beginner",
    /** Lesson badge / catalog filter — assumes prior module knowledge; never gates access. */
    Intermediate = "intermediate",
    /** Lesson badge / catalog filter — expert-path material; never gates access. */
    Advanced = "advanced",
}

export const GraphQLTypeContentDifficulty = createEnumType(
    ContentDifficulty,
)

registerEnumType(
    GraphQLTypeContentDifficulty,
    {
        name: "ContentDifficulty",
        description: "Difficulty tier for a content (lesson).",
        valuesMap: {
            [ContentDifficulty.Beginner]: {
                description: "Beginner-level lesson.",
            },
            [ContentDifficulty.Intermediate]: {
                description: "Intermediate-level lesson.",
            },
            [ContentDifficulty.Advanced]: {
                description: "Advanced-level lesson.",
            },
        },
    },
)
