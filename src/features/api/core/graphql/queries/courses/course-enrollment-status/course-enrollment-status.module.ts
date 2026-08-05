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
    CourseEnrollmentStatusHandler,
} from "./course-enrollment-status.handler"
import {
    ConfigurableModuleClass,
} from "./course-enrollment-status.module-definition"

@Module({
    providers: [
        CourseEnrollmentStatusService,
        CourseEnrollmentStatusResolver,
        CourseEnrollmentStatusHandler,
    ],
})
/** Feature-module boundary for the `courseEnrollmentStatus` query. */
export class CourseEnrollmentStatusSingleQueryModule extends ConfigurableModuleClass {}
