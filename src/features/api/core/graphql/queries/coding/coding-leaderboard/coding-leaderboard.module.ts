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
/** Wires the `codingLeaderboard` query resolver as its own registrable module. */
export class CodingLeaderboardSingleQueryModule extends ConfigurableModuleClass {}
