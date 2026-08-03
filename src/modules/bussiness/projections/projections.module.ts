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
} from "./progress"
import {
    ContentEngagementProjectionModule,
} from "./content-engagement"
import {
    UserStatsProjectionModule,
} from "./user-stats"
import {
    CourseStatsProjectionModule,
} from "./course-stats"
import {
    ContributionProjectionModule,
} from "./contribution"
import {
    UserCodingProjectionModule,
} from "./user-coding"
import {
    UserXpProjectionModule,
} from "./user-xp"
import {
    UserCapstoneProjectionModule,
} from "./user-capstone"
import {
    UserPinnedProjectsProjectionModule,
} from "./user-pinned-projects"
import {
    UserSolvedChallengesProjectionModule,
} from "./user-solved-challenges"
import {
    TrendingContentsProjectionModule,
} from "./trending-contents"
import {
    LeagueCohortPointsProjectionModule,
} from "./league-cohort-points"
import {
    UserFlashcardStatsProjectionModule,
} from "./user-flashcard-stats"
import {
    UserFlashcardCourseStatsProjectionModule,
} from "./user-flashcard-course-stats"
import {
    UserMockInterviewCourseStatsProjectionModule,
} from "./user-mock-interview-course-stats"

/**
 * Umbrella module aggregating every CQRS projection leaf-module: progress
 * (user×course), content engagement (content), user stats (user), course stats
 * (course), contribution, user coding, user XP, user capstone, user pinned
 * projects, user solved challenges, trending contents, league cohort points,
 * user flashcard stats, user flashcard course stats, and user mock-interview
 * course stats. Each leaf owns its recompute service + CDC listener and stores
 * the aggregate as a single jsonb `value` keyed by its natural key. Registering
 * this module wires + re-exports all fifteen (services stay globally injectable
 * for inline recompute from write paths).
 */
@Module({
})
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
