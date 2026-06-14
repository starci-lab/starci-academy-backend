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

@Module({
    providers: [
        LeaderboardResolver,
        LeaderboardSingleQueryService,
        LeaderboardHandler,
    ],
})
export class LeaderboardSingleQueryModule extends ConfigurableModuleClass {}
