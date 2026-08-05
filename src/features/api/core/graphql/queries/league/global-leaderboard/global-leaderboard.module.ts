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
/**
 * Wires the authenticated `globalLeaderboard` query (top users by total
 * reward points + the viewer's own standing). Resolver-only -- the FE
 * appends a "you" row when the viewer sits outside the visible top.
 */
export class GlobalLeaderboardSingleQueryModule extends ConfigurableModuleClass {}
