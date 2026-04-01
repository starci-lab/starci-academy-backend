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
    ModuleSingleQueryModule,
} from "./module"
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
        ModuleSingleQueryModule.register({
            isGlobal: true,
        }),
        CourseEnrollmentStatusQueryModule,
    ],
})
export class CoursesQueriesModule extends ConfigurableModuleClass {}
