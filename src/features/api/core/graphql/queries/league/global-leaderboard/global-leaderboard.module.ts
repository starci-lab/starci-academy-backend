import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./global-leaderboard.module-definition"
import {
    GlobalLeaderboardResolver,
} from "./global-leaderboard.resolver"

@Module({
    providers: [
        GlobalLeaderboardResolver,
    ],
})
export class GlobalLeaderboardSingleQueryModule extends ConfigurableModuleClass {}
