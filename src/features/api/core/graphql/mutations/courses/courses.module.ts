import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./courses.module-definition"
import {
    CourseEnrollSingleMutationModule,
} from "./course-enroll"

@Module({
    imports: [
        CourseEnrollSingleMutationModule.register({
            isGlobal: true,
        }),
    ],
})
export class CoursesMutationsModule extends ConfigurableModuleClass {}
