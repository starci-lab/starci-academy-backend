import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./user-courses.module-definition"
import {
    UserCoursesResolver,
} from "./user-courses.resolver"

@Module({
    providers: [
        UserCoursesResolver,
    ],
})
export class UserCoursesSingleQueryModule extends ConfigurableModuleClass {}
