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
/**
 * Registers pinning an enrolled course project — distinct from external
 * pins so a forged course id cannot land on the external-project table.
 */
export class PinCourseProjectSingleMutationModule extends ConfigurableModuleClass {}
