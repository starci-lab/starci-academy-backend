import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./contribution-projection.module-definition"
import {
    ContributionProjectionService,
} from "./contribution-projection.service"
import {
    ContributionProjectionListener,
} from "./contribution-projection.listener"

/**
 * Leaf module for the per-user contribution-calendar projection (recompute service
 * + CDC listener on the activities ledger). Exports the service so the dashboard
 * read + any inline write path can use it.
 */
@Module({
    providers: [
        ContributionProjectionService,
        ContributionProjectionListener,
    ],
    exports: [
        ContributionProjectionService,
    ],
})
export class ContributionProjectionModule extends ConfigurableModuleClass {
}
