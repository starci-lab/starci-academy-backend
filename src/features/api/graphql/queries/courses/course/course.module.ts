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

@Module({
    providers: [
        CourseService,
        CourseResolver,
    ],
})
export class CourseSingleQueryModule extends ConfigurableModuleClass {}
