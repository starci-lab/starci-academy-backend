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
import {
    ChallengeSingleQueryModule,
} from "../challenges"
import {
    ContentSingleQueryModule,
} from "../contents"
import {
    LessonVideoSingleQueryModule,
} from "../lesson-videos"
import {
    ModuleSingleQueryModule,
} from "../module"

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
        ContentSingleQueryModule.register({
            isGlobal: true,
        }),
        LessonVideoSingleQueryModule.register({
            isGlobal: true,
        }),
        ChallengeSingleQueryModule.register({
            isGlobal: true,
        }),
        CourseEnrollmentStatusQueryModule,
    ],
})
export class CoursesQueriesModule extends ConfigurableModuleClass {}
