import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./courses.module-definition"
import {
    CourseEnrollSingleMutationModule,
} from "./course-enroll/course-enroll.module"
import {
    StartTrialSingleMutationModule,
} from "./start-trial/start-trial.module"
import {
    CoursesCheckoutSingleMutationModule,
} from "./courses-checkout/courses-checkout.module"
import {
    AddToCartSingleMutationModule,
} from "./add-to-cart/add-to-cart.module"
import {
    RemoveFromCartSingleMutationModule,
} from "./remove-from-cart/remove-from-cart.module"
import {
    ClearCartSingleMutationModule,
} from "./clear-cart/clear-cart.module"
import {
    RefundCoursePurchaseSingleMutationModule,
} from "./refund-course-purchase/refund-course-purchase.module"

@Module({
    imports: [
        CourseEnrollSingleMutationModule.register({
            isGlobal: true,
        }),
        StartTrialSingleMutationModule.register({
            isGlobal: true,
        }),
        CoursesCheckoutSingleMutationModule.register({
            isGlobal: true,
        }),
        AddToCartSingleMutationModule.register({
            isGlobal: true,
        }),
        RemoveFromCartSingleMutationModule.register({
            isGlobal: true,
        }),
        ClearCartSingleMutationModule.register({
            isGlobal: true,
        }),
        RefundCoursePurchaseSingleMutationModule.register({
            isGlobal: true,
        }),
    ],
})
/** Composition root for cart, enroll, trial, and checkout writes so the schema picks them up from one import. */
export class CoursesMutationsModule extends ConfigurableModuleClass {}
