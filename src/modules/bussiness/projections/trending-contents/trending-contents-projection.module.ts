import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./trending-contents-projection.module-definition"
import {
    TrendingContentsProjectionService,
} from "./trending-contents-projection.service"
import {
    TrendingContentsProjectionListener,
} from "./trending-contents-projection.listener"

/**
 * Leaf module for the global trending-lessons projection (recompute service +
 * CDC listener on `user_contents`). Exports the service so the explore-feed
 * trending read can use it.
 */
@Module({
    providers: [
        TrendingContentsProjectionService,
        TrendingContentsProjectionListener,
    ],
    exports: [
        TrendingContentsProjectionService,
    ],
})
export class TrendingContentsProjectionModule extends ConfigurableModuleClass {
}
