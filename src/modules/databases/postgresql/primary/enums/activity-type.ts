import {
    createEnumType,
} from "@modules/common"
import {
    registerEnumType,
} from "@nestjs/graphql"

/**
 * Kind of in-app activity recorded in the append-only {@link ActivityEntity}
 * ledger. Only "trend-worthy" learner actions are tracked (achievements +
 * engagement) — auth/payment/settings/sync plumbing is deliberately excluded.
 * The GitHub-style home feed reads these rows.
 */
export enum ActivityType {
    /** Read a lesson for the first time. */
    LessonRead = "lessonRead",
    /** Bookmarked (favorited) a lesson. */
    LessonBookmarked = "lessonBookmarked",
    /** Passed a challenge (first pass). */
    ChallengePassed = "challengePassed",
    /** Got an accepted verdict on a coding problem (first solve). */
    CodingSolved = "codingSolved",
    /** Passed a personal-project milestone task (first pass). */
    MilestonePassed = "milestonePassed",
    /** Passed an AI Lab eval challenge (first pass). */
    AiLabPassed = "aiLabPassed",
    /** Enrolled in a course. */
    CourseEnrolled = "courseEnrolled",
    /** Posted a discussion comment. */
    DiscussionCommented = "discussionCommented",
    /** Started following another user. */
    UserFollowed = "userFollowed",
}

export const GraphQLTypeActivityType = createEnumType(ActivityType)

registerEnumType(
    GraphQLTypeActivityType,
    {
        name: "ActivityType",
        description: "Kind of in-app activity recorded for the home feed.",
        valuesMap: {
            [ActivityType.LessonRead]: {
                description: "Read a lesson for the first time.",
            },
            [ActivityType.LessonBookmarked]: {
                description: "Bookmarked a lesson.",
            },
            [ActivityType.ChallengePassed]: {
                description: "Passed a challenge.",
            },
            [ActivityType.CodingSolved]: {
                description: "Solved a coding problem.",
            },
            [ActivityType.MilestonePassed]: {
                description: "Passed a milestone task.",
            },
            [ActivityType.AiLabPassed]: {
                description: "Passed an AI Lab eval challenge.",
            },
            [ActivityType.CourseEnrolled]: {
                description: "Enrolled in a course.",
            },
            [ActivityType.DiscussionCommented]: {
                description: "Posted a discussion comment.",
            },
            [ActivityType.UserFollowed]: {
                description: "Started following another user.",
            },
        },
    },
)
