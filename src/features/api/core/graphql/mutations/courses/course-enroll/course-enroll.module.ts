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
    CourseEnrollService,
} from "./course-enroll.service"
import {
    CoursePricingService,
} from "./course-pricing.service"
import {
    CourseEnrollHandler,
} from "./course-enroll.handler"

@Module({
    providers: [
        CoursePricingService,
        CourseEnrollPayOsService,
        CourseEnrollSepayService,
        CourseEnrollService,
        CourseEnrollResolver,
        CourseEnrollHandler,
    ],
})
export class CourseEnrollSingleMutationModule extends ConfigurableModuleClass {}
