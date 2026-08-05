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
/** Feature-module boundary for the `myCourses` query — wires its resolver so the dashboard group can mount this widget independently. */
export class MyCoursesSingleQueryModule extends ConfigurableModuleClass {}
