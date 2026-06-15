import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./user-weekly-stats.module-definition"
import {
    UserWeeklyStatsResolver,
} from "./user-weekly-stats.resolver"

@Module({
    providers: [
        UserWeeklyStatsResolver,
    ],
})
export class UserWeeklyStatsSingleQueryModule extends ConfigurableModuleClass {}
