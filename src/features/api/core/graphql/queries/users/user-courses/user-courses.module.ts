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
/** Feature-module boundary for the `userCourses` query -- wires its resolver so the users group can mount this profile tab independently. */
export class UserCoursesSingleQueryModule extends ConfigurableModuleClass {}
