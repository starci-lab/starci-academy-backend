import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./league.module-definition"
import {
    MyLeagueSingleQueryModule,
} from "./my-league"

/**
 * League query group — the weekly-league leaf queries. Currently the single
 * `myLeague` standing query; registered global so the resolver is picked up by
 * the GraphQL schema builder.
 */
@Module({
    imports: [
        MyLeagueSingleQueryModule.register({
            isGlobal: true,
        }),
    ],
})
export class LeagueQueriesModule extends ConfigurableModuleClass {}
