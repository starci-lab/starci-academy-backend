import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./courses.module-definition"
import {
    CourseEnrollSingleMutationModule,
} from "./course-enroll"
import {
    StartTrialSingleMutationModule,
} from "./start-trial"

@Module({
    imports: [
        CourseEnrollSingleMutationModule.register({
            isGlobal: true,
        }),
        StartTrialSingleMutationModule.register({
            isGlobal: true,
        }),
    ],
})
export class CoursesMutationsModule extends ConfigurableModuleClass {}
