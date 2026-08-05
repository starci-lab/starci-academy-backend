import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./user-stats-projection.module-definition"
import {
    UserStatsProjectionService,
} from "./user-stats-projection.service"
import {
    UserStatsProjectionListener,
} from "./user-stats-projection.listener"

@Module({
    providers: [
        UserStatsProjectionService,
        UserStatsProjectionListener,
    ],
    exports: [
        UserStatsProjectionService,
    ],
})
/**
 * Leaf module for the per-user stats projection (recompute service + CDC
 * listener). Exports the service for inline recompute from write paths.
 */
export class UserStatsProjectionModule extends ConfigurableModuleClass {
}
