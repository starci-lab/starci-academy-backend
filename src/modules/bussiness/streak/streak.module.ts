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
import {
    StreakMilestoneService,
} from "./streak-milestone.service"

/**
 * Streak-freeze business module: the points-spend `buyStreakFreeze` service plus
 * its daily auto-protect cron driver, plus the streak-milestone Coin-bonus
 * checker. Exports {@link StreakService} so the GraphQL `buyStreakFreeze`
 * mutation can spend points, and {@link StreakMilestoneService} so the
 * user-stats projection listener can trigger the milestone check; the cron
 * service stays internal. The {@link UserStatsProjectionService} and
 * `NotificationService` this module's services depend on are provided by the
 * globally-registered projections + notification modules.
 */
@Module({
    providers: [
        StreakService,
        StreakFreezeCronService,
        StreakMilestoneService,
    ],
    exports: [
        StreakService,
        StreakMilestoneService,
    ],
})
export class StreakModule extends ConfigurableModuleClass {
}
