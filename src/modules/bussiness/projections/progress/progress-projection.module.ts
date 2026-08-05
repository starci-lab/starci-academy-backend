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

@Module({
    providers: [
        ProgressProjectionService,
        ProgressProjectionListener,
    ],
    exports: [
        ProgressProjectionService,
    ],
})
/**
 * Leaf module for the userxcourse progress projection (recompute service + CDC
 * listener). Exports the service for inline recompute from write paths.
 */
export class ProgressProjectionModule extends ConfigurableModuleClass {
}
