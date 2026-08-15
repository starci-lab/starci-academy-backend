import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./courses-checkout.module-definition"
import {
    CoursesCheckoutPricingService,
} from "./courses-checkout-pricing.service"
import {
    CoursesCheckoutResolver,
} from "./courses-checkout.resolver"
import {
    CoursesCheckoutService,
} from "./courses-checkout.service"
import {
    CoursesCheckoutHandler,
} from "./courses-checkout.handler"

@Module({
    providers: [
        // stateless pricing helpers (re-provided; also provided by CourseEnroll module)
        CoursesCheckoutPricingService,
        CoursesCheckoutService,
        CoursesCheckoutResolver,
        CoursesCheckoutHandler,
    ],
})
/** Isolated Nest registration for multi-course cart checkout as one payment. */
export class CoursesCheckoutSingleMutationModule extends ConfigurableModuleClass {}
