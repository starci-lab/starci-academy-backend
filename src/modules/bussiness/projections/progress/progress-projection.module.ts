import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./progress-projection.module-definition"
import {
    ProgressProjectionService,
} from "./progress-projection.service"
import {
    ProgressProjectionListener,
} from "./progress-projection.listener"

/**
 * Leaf module for the user×course progress projection (recompute service + CDC
 * listener). Exports the service for inline recompute from write paths.
 */
@Module({
    providers: [
        ProgressProjectionService,
        ProgressProjectionListener,
    ],
    exports: [
        ProgressProjectionService,
    ],
})
export class ProgressProjectionModule extends ConfigurableModuleClass {
}
