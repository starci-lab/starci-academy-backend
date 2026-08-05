import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./league-cohort-points-projection.module-definition"
import {
    LeagueCohortPointsProjectionService,
} from "./league-cohort-points-projection.service"
import {
    LeagueCohortPointsProjectionListener,
} from "./league-cohort-points-projection.listener"

@Module({
    providers: [
        LeagueCohortPointsProjectionService,
        LeagueCohortPointsProjectionListener,
    ],
    exports: [
        LeagueCohortPointsProjectionService,
    ],
})
/**
 * Leaf module for the per-cohort league points projection (recompute service +
 * CDC listener on `xp_histories`). Exports the service so the league standing
 * read can use it.
 */
export class LeagueCohortPointsProjectionModule extends ConfigurableModuleClass {
}
