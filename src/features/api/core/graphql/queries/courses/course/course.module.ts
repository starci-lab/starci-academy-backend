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
export class CourseSingleQueryModule extends ConfigurableModuleClass {}
