import {
    Module,
} from "@nestjs/common"
import {
    CourseEnrollmentStatusResolver,
} from "./course-enrollment-status.resolver"
import {
    CourseEnrollmentStatusService,
} from "./course-enrollment-status.service"

@Module({
    providers: [
        CourseEnrollmentStatusService,
        CourseEnrollmentStatusResolver,
    ],
})
export class CourseEnrollmentStatusQueryModule {}
