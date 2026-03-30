import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./courses.module-definition"
import {
    CourseEnrollmentStatusQueryModule,
} from "./course-enrollment-status"
import {
    CourseSingleQueryModule,
} from "./course"
import {
    CoursesSingleQueryModule,
} from "./courses"

@Module({
    imports: [
        CoursesSingleQueryModule.register({
            isGlobal: true,
        }),
        CourseSingleQueryModule.register({
            isGlobal: true,
        }),
        CourseEnrollmentStatusQueryModule,
    ],
})
export class CoursesQueriesModule extends ConfigurableModuleClass {}
