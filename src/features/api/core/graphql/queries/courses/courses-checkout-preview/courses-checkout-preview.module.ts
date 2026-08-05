import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./courses-checkout-preview.module-definition"
import {
    CoursePricingService,
} from "@features/api/core/graphql/mutations/courses/course-enroll/course-pricing.service"
import {
    CoursesCheckoutPricingService,
} from "@features/api/core/graphql/mutations/courses/courses-checkout"
import {
    CoursesCheckoutPreviewResolver,
} from "./courses-checkout-preview.resolver"
import {
    CoursesCheckoutPreviewService,
} from "./courses-checkout-preview.service"

@Module({
    providers: [
        // re-provide the stateless pricing helpers this query prices with; the
        // preview reuses the exact same code path the real checkout charges with
        CoursePricingService,
        CoursesCheckoutPricingService,
        CoursesCheckoutPreviewService,
        CoursesCheckoutPreviewResolver,
    ],
})
/**
 * Feature-module boundary for `coursesCheckoutPreview` -- re-provides the same
 * pricing helpers the real checkout charges with so the preview cannot drift.
 */
export class CoursesCheckoutPreviewSingleQueryModule extends ConfigurableModuleClass {}
