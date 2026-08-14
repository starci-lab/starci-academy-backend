import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./course-review-stats-projection.module-definition"
import {
    CourseReviewStatsProjectionService,
} from "./course-review-stats-projection.service"
import {
    CourseReviewStatsProjectionListener,
} from "./course-review-stats-projection.listener"

@Module({
    providers: [
        CourseReviewStatsProjectionService,
        CourseReviewStatsProjectionListener,
    ],
    exports: [
        CourseReviewStatsProjectionService,
    ],
})
/**
 * Leaf module for the per-course review aggregate (recompute service + CDC listener).
 * Exports the service so a write path can recompute inline inside its own transaction.
 */
export class CourseReviewStatsProjectionModule extends ConfigurableModuleClass {
}
