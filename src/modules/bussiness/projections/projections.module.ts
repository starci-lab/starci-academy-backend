import {
    type DynamicModule,
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
    type OPTIONS_TYPE,
} from "./projections.module-definition"
import {
    ProgressProjectionModule,
} from "./progress/progress-projection.module"
import {
    ContentEngagementProjectionModule,
} from "./content-engagement/content-engagement-projection.module"
import {
    UserStatsProjectionModule,
} from "./user-stats/user-stats-projection.module"
import {
    CourseStatsProjectionModule,
} from "./course-stats/course-stats-projection.module"
import {
    CourseReviewStatsProjectionModule,
} from "./course-review-stats/course-review-stats-projection.module"
import {
    ContributionProjectionModule,
} from "./contribution/contribution-projection.module"
import {
    UserCodingProjectionModule,
} from "./user-coding/user-coding-projection.module"
import {
    UserXpProjectionModule,
} from "./user-xp/user-xp-projection.module"
import {
    UserCapstoneProjectionModule,
} from "./user-capstone/user-capstone-projection.module"
import {
    UserPinnedProjectsProjectionModule,
} from "./user-pinned-projects/user-pinned-projects-projection.module"
import {
    UserSolvedChallengesProjectionModule,
} from "./user-solved-challenges/user-solved-challenges-projection.module"
import {
    TrendingContentsProjectionModule,
} from "./trending-contents/trending-contents-projection.module"
import {
    LeagueCohortPointsProjectionModule,
} from "./league-cohort-points/league-cohort-points-projection.module"
import {
    UserFlashcardStatsProjectionModule,
} from "./user-flashcard-stats/user-flashcard-stats-projection.module"
import {
    UserFlashcardCourseStatsProjectionModule,
} from "./user-flashcard-course-stats/user-flashcard-course-stats-projection.module"
import {
    UserMockInterviewCourseStatsProjectionModule,
} from "./user-mock-interview-course-stats/user-mock-interview-course-stats-projection.module"

@Module({
})
/**
 * Umbrella module aggregating every CQRS projection leaf-module: progress
 * (userxcourse), content engagement (content), user stats (user), course stats
 * (course), contribution, user coding, user XP, user capstone, user pinned
 * projects, user solved challenges, trending contents, league cohort points,
 * user flashcard stats, user flashcard course stats, and user mock-interview
 * course stats. Each leaf owns its recompute service + CDC listener and stores
 * the aggregate as a single jsonb `value` keyed by its natural key. Registering
 * this module wires + re-exports all fifteen (services stay globally injectable
 * for inline recompute from write paths).
 */
export class ProjectionsModule extends ConfigurableModuleClass {
    /**
     * Compose the fifteen projection leaf-modules, forwarding the register
     * options (e.g. `isGlobal`) so their exported services resolve everywhere.
     *
     * @param options - {@link OPTIONS_TYPE}
     * @returns the composed dynamic module.
     */
    static register(options: typeof OPTIONS_TYPE): DynamicModule {
        // start from the configurable-module definition (applies isGlobal)
        const dynamicModule = super.register(options)
        // each projection is its own leaf module, registered with the same options
        const modules = [
            ProgressProjectionModule.register(options),
            ContentEngagementProjectionModule.register(options),
            UserStatsProjectionModule.register(options),
            CourseStatsProjectionModule.register(options),
            CourseReviewStatsProjectionModule.register(options),
            ContributionProjectionModule.register(options),
            UserCodingProjectionModule.register(options),
            UserXpProjectionModule.register(options),
            UserCapstoneProjectionModule.register(options),
            UserPinnedProjectsProjectionModule.register(options),
            UserSolvedChallengesProjectionModule.register(options),
            TrendingContentsProjectionModule.register(options),
            LeagueCohortPointsProjectionModule.register(options),
            UserFlashcardStatsProjectionModule.register(options),
            UserFlashcardCourseStatsProjectionModule.register(options),
            UserMockInterviewCourseStatsProjectionModule.register(options),
        ]
        return {
            ...dynamicModule,
            imports: [
                ...modules,
            ],
            exports: [
                ...modules,
            ],
        }
    }
}
