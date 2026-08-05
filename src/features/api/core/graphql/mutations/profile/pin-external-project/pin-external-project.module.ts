import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./pin-external-project.module-definition"
import {
    PinExternalProjectResolver,
} from "./pin-external-project.resolver"

@Module({
    providers: [
        PinExternalProjectResolver,
    ],
})
/**
 * Registers pinning a URL the user typed (not an enrollment) — kept off
 * pinCourseProject so course ownership checks are never skipped.
 */
export class PinExternalProjectSingleMutationModule extends ConfigurableModuleClass {}
