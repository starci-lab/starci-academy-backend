import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./league.module-definition"
import {
    LeagueService,
} from "./league.service"
import {
    LeagueResetService,
} from "./league-reset.service"

/**
 * Weekly-league business module: the standing/reset service plus its weekly cron
 * driver. Exports {@link LeagueService} so the GraphQL leaf (and any future write
 * path) can read a viewer's standing; the cron service stays internal.
 */
@Module({
    providers: [
        LeagueService,
        LeagueResetService,
    ],
    exports: [
        LeagueService,
    ],
})
export class LeagueModule extends ConfigurableModuleClass {
}
