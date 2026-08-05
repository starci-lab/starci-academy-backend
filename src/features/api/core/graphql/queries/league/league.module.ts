import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./league.module-definition"
import {
    MyLeagueSingleQueryModule,
} from "./my-league/my-league.module"
import {
    GlobalLeaderboardSingleQueryModule,
} from "./global-leaderboard/global-leaderboard.module"

@Module({
    imports: [
        MyLeagueSingleQueryModule.register({
            isGlobal: true,
        }),
        GlobalLeaderboardSingleQueryModule.register({
            isGlobal: true,
        }),
    ],
})
/**
 * League query group -- the weekly-league leaf queries: the `myLeague` standing
 * board + the `globalLeaderboard` all-users board. Registered global so the
 * resolvers are picked up by the GraphQL schema builder.
 */
export class LeagueQueriesModule extends ConfigurableModuleClass {}
