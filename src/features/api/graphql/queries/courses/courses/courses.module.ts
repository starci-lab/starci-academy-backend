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
import {
    CourseCdnResolver,
} from "./course-cdn.resolver"

@Module({
    providers: [
        CoursesService,
        CoursesResolver,
        CourseCdnResolver,
    ],
})
export class CoursesSingleQueryModule extends ConfigurableModuleClass {}
