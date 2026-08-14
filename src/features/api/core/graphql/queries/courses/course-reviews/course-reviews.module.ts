import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./course-reviews.module-definition"
import {
    CourseReviewsResolver,
} from "./course-reviews.resolver"
import {
    CourseReviewsService,
} from "./course-reviews.service"
import {
    CourseReviewsHandler,
} from "./course-reviews.handler"

@Module({
    providers: [
        CourseReviewsService,
        CourseReviewsResolver,
        CourseReviewsHandler,
    ],
})
/** Isolated Nest registration for reading a course's reviews. */
export class CourseReviewsSingleQueryModule extends ConfigurableModuleClass {}
