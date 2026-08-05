import {
    createEnumType,
} from "@modules/lib/common/utils/enum"
import {
    registerEnumType,
} from "@nestjs/graphql"

/**
 * Kind of learning event surfaced in the per-course learning history timeline.
 * A deliberately narrow subset of the global {@link ActivityType} ledger -- only
 * the three "made progress in this course" events the history groups by day.
 */
export enum CourseLearningEventType {
    /** Read a lesson (content) for the first time. */
    LessonRead = "lessonRead",
    /** Passed a challenge attached to a lesson. */
    ChallengePassed = "challengePassed",
    /** Passed a personal-project milestone task. */
    MilestonePassed = "milestonePassed",
}

export const GraphQLTypeCourseLearningEventType = createEnumType(
    CourseLearningEventType,
)

registerEnumType(
    GraphQLTypeCourseLearningEventType,
    {
        name: "CourseLearningEventType",
        description: "Kind of per-course learning event (lesson/challenge/milestone).",
        valuesMap: {
            [CourseLearningEventType.LessonRead]: {
                description: "Read a lesson for the first time.",
            },
            [CourseLearningEventType.ChallengePassed]: {
                description: "Passed a challenge attached to a lesson.",
            },
            [CourseLearningEventType.MilestonePassed]: {
                description: "Passed a personal-project milestone task.",
            },
        },
    },
)
