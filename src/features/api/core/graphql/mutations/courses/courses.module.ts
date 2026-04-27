import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./courses.module-definition"
import {
    CourseEnrollMutationModule,
} from "./course-enroll"

@Module({
    imports: [
        CourseEnrollMutationModule,
    ],
})
export class CoursesMutationsModule extends ConfigurableModuleClass {}
