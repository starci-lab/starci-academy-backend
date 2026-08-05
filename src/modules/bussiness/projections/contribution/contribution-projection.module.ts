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

@Module({
    providers: [
        ContributionProjectionService,
        ContributionProjectionListener,
    ],
    exports: [
        ContributionProjectionService,
    ],
})
/**
 * Leaf module for the per-user contribution-calendar projection (recompute service
 * + CDC listener on the activities ledger). Exports the service so the dashboard
 * read + any inline write path can use it.
 */
export class ContributionProjectionModule extends ConfigurableModuleClass {
}
