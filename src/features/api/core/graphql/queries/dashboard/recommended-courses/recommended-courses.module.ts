import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./recommended-courses.module-definition"
import {
    RecommendedCoursesResolver,
} from "./recommended-courses.resolver"
import {
    RecommendedCoursesService,
} from "./recommended-courses.service"
import {
    CoursePricingService,
} from "../../../mutations/courses/course-enroll/course-pricing.service"

/**
 * Recommended-courses query module. Provides its own {@link CoursePricingService}
 * instance (a plain stateless provider scoped to the enroll module) so the
 * listing prices courses with the exact same logic used at checkout. The
 * {@link LoyaltyDiscountService} comes from the globally-registered bussiness
 * module.
 */
@Module({
    providers: [
        CoursePricingService,
        RecommendedCoursesService,
        RecommendedCoursesResolver,
    ],
})
export class RecommendedCoursesSingleQueryModule extends ConfigurableModuleClass {}
