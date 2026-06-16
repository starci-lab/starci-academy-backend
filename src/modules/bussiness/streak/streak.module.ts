import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./streak.module-definition"
import {
    StreakService,
} from "./streak.service"
import {
    StreakFreezeCronService,
} from "./streak-freeze-cron.service"

/**
 * Streak-freeze business module: the points-spend `buyStreakFreeze` service plus
 * its daily auto-protect cron driver. Exports {@link StreakService} so the
 * GraphQL `buyStreakFreeze` mutation can spend points; the cron service stays
 * internal. The {@link UserStatsProjectionService} it depends on is provided by
 * the globally-registered projections module.
 */
@Module({
    providers: [
        StreakService,
        StreakFreezeCronService,
    ],
    exports: [
        StreakService,
    ],
})
export class StreakModule extends ConfigurableModuleClass {
}
