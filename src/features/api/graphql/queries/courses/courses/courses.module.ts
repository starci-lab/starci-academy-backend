import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./courses.module-definition"
import {
    CoursesResolver,
} from "./courses.resolver"
import {
    CoursesService,
} from "./courses.service"

@Module({
    providers: [
        CoursesService,
        CoursesResolver,
    ],
})
export class CoursesSingleQueryModule extends ConfigurableModuleClass {}
