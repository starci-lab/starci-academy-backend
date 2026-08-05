import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./my-league.module-definition"
import {
    MyLeagueResolver,
} from "./my-league.resolver"

@Module({
    providers: [
        MyLeagueResolver,
    ],
})
/**
 * Wires the authenticated `myLeague` weekly standing query. Resolver-only
 * — never-seen users are lazily placed into Bronze + the open cohort on
 * first read.
 */
export class MyLeagueSingleQueryModule extends ConfigurableModuleClass {}
