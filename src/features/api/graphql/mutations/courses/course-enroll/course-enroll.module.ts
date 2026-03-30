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

@Module({
    providers: [
        CoursePricingService,
        CourseEnrollPayOsService,
        CourseEnrollSepayService,
        CourseEnrollService,
        CourseEnrollResolver,
    ],
})
export class CourseEnrollMutationModule {}
