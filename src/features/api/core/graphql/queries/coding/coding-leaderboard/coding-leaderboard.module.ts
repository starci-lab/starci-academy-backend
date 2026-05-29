import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./coding-leaderboard.module-definition"
import {
    CodingLeaderboardResolver,
} from "./coding-leaderboard.resolver"

@Module({
    providers: [
        CodingLeaderboardResolver,
    ],
})
export class CodingLeaderboardSingleQueryModule extends ConfigurableModuleClass {}
