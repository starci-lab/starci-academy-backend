import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./platform-stats.module-definition"
import {
    PlatformStatsResolver,
} from "./platform-stats.resolver"
import {
    PlatformStatsService,
} from "./platform-stats.service"
import {
    PlatformStatsHandler,
} from "./platform-stats.handler"

@Module({
    providers: [
        PlatformStatsService,
        PlatformStatsResolver,
        PlatformStatsHandler,
    ],
})
export class PlatformStatsSingleQueryModule
    extends ConfigurableModuleClass {}
