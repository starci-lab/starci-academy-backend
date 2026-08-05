import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./user-mock-interview-course-stats-projection.module-definition"
import {
    UserMockInterviewCourseStatsProjectionService,
} from "./user-mock-interview-course-stats-projection.service"
import {
    UserMockInterviewCourseStatsProjectionListener,
} from "./user-mock-interview-course-stats-projection.listener"

@Module({
    providers: [
        UserMockInterviewCourseStatsProjectionService,
        UserMockInterviewCourseStatsProjectionListener,
    ],
    exports: [
        UserMockInterviewCourseStatsProjectionService,
    ],
})
/**
 * Leaf module for the per-enrollment mock-interview-course-stats projection
 * (recompute service + CDC listener on `mock_interview_attempts`). Exports
 * the service so `myMockInterviewStats` can read it.
 */
export class UserMockInterviewCourseStatsProjectionModule extends ConfigurableModuleClass {
}
