import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./contribution-projection.module-definition"
import {
    ContributionProjectionService,
} from "./contribution-projection.service"

/**
 * Leaf module for the per-user contribution-calendar projection. Exports the
 * service so the dashboard read + any inline write path can use it.
 */
@Module({
    providers: [
        ContributionProjectionService,
    ],
    exports: [
        ContributionProjectionService,
    ],
})
export class ContributionProjectionModule extends ConfigurableModuleClass {
}
