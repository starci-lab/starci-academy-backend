import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./delete-course-review.module-definition"
import {
    DeleteCourseReviewResolver,
} from "./delete-course-review.resolver"
import {
    DeleteCourseReviewService,
} from "./delete-course-review.service"
import {
    DeleteCourseReviewHandler,
} from "./delete-course-review.handler"

@Module({
    providers: [
        DeleteCourseReviewService,
        DeleteCourseReviewResolver,
        DeleteCourseReviewHandler,
    ],
})
/** Isolated Nest registration for writing a course review. */
export class DeleteCourseReviewSingleMutationModule extends ConfigurableModuleClass {}
