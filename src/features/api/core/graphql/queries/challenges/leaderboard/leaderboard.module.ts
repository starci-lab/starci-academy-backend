import {
    ConfigurableModuleClass,
} from "./leaderboard.module-definition"
import {
    Module,
} from "@nestjs/common"
import {
    LeaderboardResolver,
} from "./leaderboard.resolver"
import {
    LeaderboardSingleQueryService,
} from "./leaderboard.service"
import {
    LeaderboardHandler,
} from "./leaderboard.handler"
import {
    LeaderboardListener,
} from "./leaderboard.listener"

@Module({
    providers: [
        LeaderboardResolver,
        LeaderboardSingleQueryService,
        LeaderboardHandler,
        LeaderboardListener,
    ],
})
export class LeaderboardSingleQueryModule extends ConfigurableModuleClass {}
