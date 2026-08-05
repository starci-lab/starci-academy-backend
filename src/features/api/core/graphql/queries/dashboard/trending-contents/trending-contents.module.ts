import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./trending-contents.module-definition"
import {
    TrendingContentsResolver,
} from "./trending-contents.resolver"

@Module({
    providers: [
        TrendingContentsResolver,
    ],
})
/** Feature-module boundary for the `trendingContents` query — wires its resolver so the dashboard group can mount this widget independently. */
export class TrendingContentsSingleQueryModule extends ConfigurableModuleClass {}
