import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./my-courses.module-definition"
import {
    MyCoursesResolver,
} from "./my-courses.resolver"

@Module({
    providers: [
        MyCoursesResolver,
    ],
})
export class MyCoursesSingleQueryModule extends ConfigurableModuleClass {}
