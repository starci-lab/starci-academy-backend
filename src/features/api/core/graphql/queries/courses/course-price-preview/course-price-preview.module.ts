import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./course-price-preview.module-definition"
import {
    CoursePricePreviewResolver,
} from "./course-price-preview.resolver"
import {
    CoursePricePreviewService,
} from "./course-price-preview.service"
import {
    CoursePricingService,
} from "../../../mutations/courses/course-enroll/course-pricing.service"

/**
 * Course price-preview query module. Provides its own {@link CoursePricingService}
 * instance (a stateless provider) so the preview prices a course with the exact same
 * logic used at checkout. {@link LoyaltyDiscountService} comes from the globally
 * registered bussiness module.
 */
@Module({
    providers: [
        CoursePricingService,
        CoursePricePreviewService,
        CoursePricePreviewResolver,
    ],
})
export class CoursePricePreviewSingleQueryModule extends ConfigurableModuleClass {}
