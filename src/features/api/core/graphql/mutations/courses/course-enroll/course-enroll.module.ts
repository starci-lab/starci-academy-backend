import {
    ConfigurableModuleClass,
} from "./course-enroll.module-definition"
import {
    Module,
} from "@nestjs/common"
import {
    CourseEnrollPayOsService,
} from "./course-enroll-payos.service"
import {
    CourseEnrollResolver,
} from "./course-enroll.resolver"
import {
    CourseEnrollSepayService,
} from "./course-enroll-sepay.service"
import {
    CourseEnrollStripeService,
} from "./course-enroll-stripe.service"
import {
    CourseEnrollPaypalService,
} from "./course-enroll-paypal.service"
import {
    CourseEnrollCryptoService,
} from "./course-enroll-crypto.service"
import {
    CourseEnrollService,
} from "./course-enroll.service"
import {
    CourseEnrollHandler,
} from "./course-enroll.handler"

@Module({
    providers: [
        CourseEnrollPayOsService,
        CourseEnrollSepayService,
        CourseEnrollStripeService,
        CourseEnrollPaypalService,
        CourseEnrollCryptoService,
        CourseEnrollService,
        CourseEnrollResolver,
        CourseEnrollHandler,
    ],
})
/** Isolated Nest registration for single-course enroll checkout without pulling cart checkout into the same graph. */
export class CourseEnrollSingleMutationModule extends ConfigurableModuleClass {}
