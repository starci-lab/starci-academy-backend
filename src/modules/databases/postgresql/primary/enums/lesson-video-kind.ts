import {
    registerEnumType,
} from "@nestjs/graphql"
import {
    createEnumType,
} from "@modules/common"

/**
 * Production stage / quality tier for a module lesson video.
 * Stored in `lesson_videos.kind`.
 */
export enum LessonVideoKind {
    /** Raw livestream recording (unprocessed). */
    RawStream = "rawStream",
    /** Edited livestream (cleaned, cut, structured). */
    EditedStream = "editedStream",
    /** Premium recorded version (high quality, curated). */
    PremiumRecord = "premiumRecord",
}

/**
 * GraphQL type for lesson video kind.
 */
export const GraphQLTypeLessonVideoKind = createEnumType(
    LessonVideoKind,
)

/**
 * Register GraphQL type for lesson video kind.
 */
registerEnumType(
    GraphQLTypeLessonVideoKind,
    {
        name: "LessonVideoKind",
        description: "Lesson video production type (raw, edited, or premium recording).",
        valuesMap: {
            [LessonVideoKind.RawStream]: {
                description: "Raw livestream recording (unprocessed).",
            },
            [LessonVideoKind.EditedStream]: {
                description: "Edited livestream (cleaned, cut, structured).",
            },
            [LessonVideoKind.PremiumRecord]: {
                description: "Premium studio recording (best quality).",
            },
        },
    },
)
