import {
    ActivityType,
} from "@modules/databases"
import {
    MyFeedCategory,
} from "../graphql-types"

/**
 * Maps a feed filter chip to the set of activity types it surfaces. `null` means
 * no filter (the `All` chip). Used by the resolver to build the `type = ANY(...)`
 * predicate.
 */
export const CATEGORY_TYPE_MAP: Record<MyFeedCategory, Array<ActivityType> | null> = {
    [MyFeedCategory.All]: null,
    [MyFeedCategory.Courses]: [
        ActivityType.CourseEnrolled,
        ActivityType.LessonRead,
        ActivityType.LessonBookmarked,
    ],
    [MyFeedCategory.Achievements]: [
        ActivityType.ChallengePassed,
        ActivityType.MilestonePassed,
        ActivityType.CodingSolved,
        ActivityType.AiLabPassed,
    ],
    [MyFeedCategory.People]: [
        ActivityType.UserFollowed,
        ActivityType.DiscussionCommented,
    ],
}

/**
 * Base relevance weight per activity type, before recency decay. Accomplishments
 * (passing a milestone / AI-Lab / challenge) float to the top of the feed;
 * low-signal social noise (follows, bookmarks) sinks. The final feed score is
 * `weight x 0.5 ^ (ageHours / FEED_SCORE_HALF_LIFE_HOURS)`, so a fresh follow can
 * still out-rank a week-old completion -- recency always matters.
 */
export const ACTIVITY_TYPE_WEIGHT: Record<ActivityType, number> = {
    /** Beat a personal-project milestone -- top accomplishment. */
    [ActivityType.MilestonePassed]: 100,
    /** Passed an AI-Lab eval -- top accomplishment. */
    [ActivityType.AiLabPassed]: 100,
    /** Passed a challenge -- strong accomplishment. */
    [ActivityType.ChallengePassed]: 80,
    /** Accepted a coding solution -- strong accomplishment. */
    [ActivityType.CodingSolved]: 80,
    /** Finished reading a lesson -- meaningful progress. */
    [ActivityType.LessonRead]: 45,
    /** Enrolled in a course -- intent signal. */
    [ActivityType.CourseEnrolled]: 45,
    /** Commented in a discussion -- engagement. */
    [ActivityType.DiscussionCommented]: 25,
    /** Bookmarked a lesson -- low signal. */
    [ActivityType.LessonBookmarked]: 15,
    /** Followed someone -- lowest signal. */
    [ActivityType.UserFollowed]: 12,
}

/** Fallback weight for any activity type missing from {@link ACTIVITY_TYPE_WEIGHT}. */
export const DEFAULT_ACTIVITY_WEIGHT = 20

/**
 * Half-life (hours) of the feed-score recency decay. After this many hours an
 * event's weight is halved; after 2x it is quartered, etc. 48h keeps roughly the
 * last two days prominent while older events fade but never fully vanish.
 */
export const FEED_SCORE_HALF_LIFE_HOURS = 48
