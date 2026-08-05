import {
    registerEnumType,
} from "@nestjs/graphql"
import {
    createEnumType,
} from "@modules/lib/common/utils/enum"

/**
 * Learning tier of a module, shared across every course (Fullstack, System Design, ...).
 * Stored explicitly in `modules.content_tier` so tiering never depends on `orderIndex`.
 * Drives the tier-based paywall: advanced modules are premium, the later half of the
 * intermediate modules are premium, foundation modules are always free.
 */
export enum CourseContentTier {
    /** Entry-level material -- always free. */
    Foundation = "foundation",
    /** Mid-level material -- the later half (by order) is premium. */
    Intermediate = "intermediate",
    /** Advanced material -- always premium. */
    Advanced = "advanced",
}

export const GraphQLTypeCourseContentTier = createEnumType(
    CourseContentTier,
)

registerEnumType(
    GraphQLTypeCourseContentTier,
    {
        name: "CourseContentTier",
        description: "Learning tier of a module (foundation / intermediate / advanced).",
        valuesMap: {
            [CourseContentTier.Foundation]: {
                description: "Entry-level module — always free.",
            },
            [CourseContentTier.Intermediate]: {
                description: "Mid-level module — later half is premium.",
            },
            [CourseContentTier.Advanced]: {
                description: "Advanced module — always premium.",
            },
        },
    },
)
