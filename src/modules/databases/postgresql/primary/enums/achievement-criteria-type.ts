import {
    createEnumType,
} from "@modules/common/utils/enum"
import {
    registerEnumType,
} from "@nestjs/graphql"

/**
 * The source metric an {@link AchievementEntity} is measured against. Each
 * value names a count the achievements service derives per user from the source
 * tables; the user "earns" the achievement once that count reaches the
 * definition's `threshold` (or one of its `tierThresholds`). Mirrors the same
 * join logic the progress projection uses for its per-course metrics.
 */
export enum AchievementCriteriaType {
    /** Lessons the user has read (count of `user_contents.is_read = true`). */
    LessonsRead = "lessonsRead",
    /** Current consecutive-day streak of XP-earning days (gaps-and-islands). */
    StreakDays = "streakDays",
    /** Distinct challenges the user has passed (max attempt score reached the bar). */
    ChallengesPassed = "challengesPassed",
    /** Milestone tasks the user has passed (count of passed task attempts). */
    MilestonesPassed = "milestonesPassed",
    /** Courses the user is enrolled in (count of `enrollments`). */
    CoursesEnrolled = "coursesEnrolled",
}

export const GraphQLTypeAchievementCriteriaType = createEnumType(AchievementCriteriaType)

registerEnumType(
    GraphQLTypeAchievementCriteriaType,
    {
        name: "AchievementCriteriaType",
        description:
            "The source metric an achievement is measured against "
            + "(lessonsRead / streakDays / challengesPassed / milestonesPassed / coursesEnrolled).",
        valuesMap: {
            [AchievementCriteriaType.LessonsRead]: {
                description: "Lessons the user has read.",
            },
            [AchievementCriteriaType.StreakDays]: {
                description: "Current consecutive-day XP streak.",
            },
            [AchievementCriteriaType.ChallengesPassed]: {
                description: "Distinct challenges the user has passed.",
            },
            [AchievementCriteriaType.MilestonesPassed]: {
                description: "Milestone tasks the user has passed.",
            },
            [AchievementCriteriaType.CoursesEnrolled]: {
                description: "Courses the user is enrolled in.",
            },
        },
    },
)
