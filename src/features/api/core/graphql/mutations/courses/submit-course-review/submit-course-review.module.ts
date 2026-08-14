import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./submit-course-review.module-definition"
import {
    SubmitCourseReviewResolver,
} from "./submit-course-review.resolver"
import {
    SubmitCourseReviewService,
} from "./submit-course-review.service"
import {
    SubmitCourseReviewHandler,
} from "./submit-course-review.handler"

@Module({
    providers: [
        SubmitCourseReviewService,
        SubmitCourseReviewResolver,
        SubmitCourseReviewHandler,
    ],
})
/** Isolated Nest registration for writing a course review. */
export class SubmitCourseReviewSingleMutationModule extends ConfigurableModuleClass {}
