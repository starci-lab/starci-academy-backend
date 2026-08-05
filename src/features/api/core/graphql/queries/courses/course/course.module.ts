import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./course.module-definition"
import {
    CourseResolver,
} from "./course.resolver"
import {
    CourseService,
} from "./course.service"
import {
    CourseHandler,
} from "./course.handler"

@Module({
    providers: [
        CourseService,
        CourseResolver,
        CourseHandler,
    ],
})
/** Feature-module boundary for the `course` query. */
export class CourseSingleQueryModule extends ConfigurableModuleClass {}
