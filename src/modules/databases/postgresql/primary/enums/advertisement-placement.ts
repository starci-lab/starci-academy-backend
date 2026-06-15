import {
    registerEnumType,
} from "@nestjs/graphql"
import {
    createEnumType,
} from "@modules/common"

/**
 * Where an advertisement banner is shown. One enum value per UI slot so more
 * placements can be added without a schema change.
 */
export enum AdvertisementPlacement {
    /** The right rail of the logged-in dashboard. */
    DashboardRight = "dashboard_right",
    /** Interstitial modal shown when a non-enrolled viewer opens a lesson. */
    LessonInterstitial = "lesson_interstitial",
    /** Banner on the public course detail page (below the enroll card). */
    CourseDetail = "course_detail",
    /** Inline banner inside the lesson reader (below the paywall fade). */
    LessonInline = "lesson_inline",
    /** Right rail of the coding practice list. */
    PracticeRail = "practice_rail",
    /** Right rail of the course leaderboard. */
    LeaderboardRail = "leaderboard_rail",
}

/** GraphQL type for the advertisement placement enum. */
export const GraphQLTypeAdvertisementPlacement = createEnumType(
    AdvertisementPlacement,
)

registerEnumType(
    GraphQLTypeAdvertisementPlacement,
    {
        name: "AdvertisementPlacement",
        description: "UI slot an advertisement banner is shown in.",
        valuesMap: {
            [AdvertisementPlacement.DashboardRight]: {
                description: "The right rail of the logged-in dashboard.",
            },
            [AdvertisementPlacement.LessonInterstitial]: {
                description: "Interstitial modal shown when a non-enrolled viewer opens a lesson.",
            },
            [AdvertisementPlacement.CourseDetail]: {
                description: "Banner on the public course detail page (below the enroll card).",
            },
            [AdvertisementPlacement.LessonInline]: {
                description: "Inline banner inside the lesson reader (below the paywall fade).",
            },
            [AdvertisementPlacement.PracticeRail]: {
                description: "Right rail of the coding practice list.",
            },
            [AdvertisementPlacement.LeaderboardRail]: {
                description: "Right rail of the course leaderboard.",
            },
        },
    },
)
