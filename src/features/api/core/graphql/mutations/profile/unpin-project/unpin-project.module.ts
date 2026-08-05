import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./unpin-project.module-definition"
import {
    UnpinProjectResolver,
} from "./unpin-project.resolver"

@Module({
    providers: [
        UnpinProjectResolver,
    ],
})
/**
 * Registers unpin as its own leaf -- removing a pin must not go through
 * reorder / pin-course / pin-external, which have different ownership checks.
 */
export class UnpinProjectSingleMutationModule extends ConfigurableModuleClass {}
