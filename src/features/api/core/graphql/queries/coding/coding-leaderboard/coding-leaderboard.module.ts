import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./coding-leaderboard.module-definition"
import {
    CodingLeaderboardResolver,
} from "./coding-leaderboard.resolver"

/** Wires the `codingLeaderboard` query resolver as its own registrable module. */
@Module({
    providers: [
        CodingLeaderboardResolver,
    ],
})
export class CodingLeaderboardSingleQueryModule extends ConfigurableModuleClass {}
