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
export class TrendingContentsSingleQueryModule extends ConfigurableModuleClass {}
