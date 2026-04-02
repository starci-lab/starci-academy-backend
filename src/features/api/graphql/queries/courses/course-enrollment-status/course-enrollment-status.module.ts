import {
    Module,
} from "@nestjs/common"
import {
    CourseEnrollmentStatusResolver,
} from "./course-enrollment-status.resolver"
import {
    CourseEnrollmentStatusService,
} from "./course-enrollment-status.service"
import {
    ConfigurableModuleClass,
} from "./course-enrollment-status.module-definition"

@Module({
    providers: [
        CourseEnrollmentStatusService,
        CourseEnrollmentStatusResolver,
    ],
})
export class CourseEnrollmentStatusQueryModule extends ConfigurableModuleClass {}
