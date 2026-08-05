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
/** Feature-module boundary for the `userWeeklyStats` query -- wires its resolver so the users group can mount this profile tab independently. */
export class UserWeeklyStatsSingleQueryModule extends ConfigurableModuleClass {}
