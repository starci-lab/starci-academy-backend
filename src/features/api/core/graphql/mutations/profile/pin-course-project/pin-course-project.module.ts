import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./pin-course-project.module-definition"
import {
    PinCourseProjectResolver,
} from "./pin-course-project.resolver"

@Module({
    providers: [
        PinCourseProjectResolver,
    ],
})
export class PinCourseProjectSingleMutationModule extends ConfigurableModuleClass {}
