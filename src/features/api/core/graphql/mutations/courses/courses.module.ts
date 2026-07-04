import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./courses.module-definition"
import {
    CourseEnrollSingleMutationModule,
} from "./course-enroll"
import {
    StartTrialSingleMutationModule,
} from "./start-trial"
import {
    CoursesCheckoutSingleMutationModule,
} from "./courses-checkout"
import {
    AddToCartSingleMutationModule,
} from "./add-to-cart"
import {
    RemoveFromCartSingleMutationModule,
} from "./remove-from-cart"
import {
    ClearCartSingleMutationModule,
} from "./clear-cart"

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
    ],
})
export class CoursesMutationsModule extends ConfigurableModuleClass {}
