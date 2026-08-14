import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./update-course-review.module-definition"
import {
    UpdateCourseReviewResolver,
} from "./update-course-review.resolver"
import {
    UpdateCourseReviewService,
} from "./update-course-review.service"
import {
    UpdateCourseReviewHandler,
} from "./update-course-review.handler"

@Module({
    providers: [
        UpdateCourseReviewService,
        UpdateCourseReviewResolver,
        UpdateCourseReviewHandler,
    ],
})
/** Isolated Nest registration for writing a course review. */
export class UpdateCourseReviewSingleMutationModule extends ConfigurableModuleClass {}
