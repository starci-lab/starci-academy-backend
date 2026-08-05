import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./content-engagement-projection.module-definition"
import {
    ContentEngagementProjectionService,
} from "./content-engagement-projection.service"
import {
    ContentEngagementProjectionListener,
} from "./content-engagement-projection.listener"

@Module({
    providers: [
        ContentEngagementProjectionService,
        ContentEngagementProjectionListener,
    ],
    exports: [
        ContentEngagementProjectionService,
    ],
})
/**
 * Leaf module for the per-content engagement projection (recompute service + CDC
 * listener). Exports the service for inline recompute from write paths.
 */
export class ContentEngagementProjectionModule extends ConfigurableModuleClass {
}
