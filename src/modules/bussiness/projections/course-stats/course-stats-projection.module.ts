import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./course-stats-projection.module-definition"
import {
    CourseStatsProjectionService,
} from "./course-stats-projection.service"
import {
    CourseStatsProjectionListener,
} from "./course-stats-projection.listener"

/**
 * Leaf module for the per-course stats projection (recompute service + CDC
 * listener). Exports the service for inline recompute from write paths.
 */
@Module({
    providers: [
        CourseStatsProjectionService,
        CourseStatsProjectionListener,
    ],
    exports: [
        CourseStatsProjectionService,
    ],
})
export class CourseStatsProjectionModule extends ConfigurableModuleClass {
}
