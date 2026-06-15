import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./achievements.module-definition"
import {
    AchievementsService,
} from "./achievements.service"
import {
    AchievementsListener,
} from "./achievements.listener"

/**
 * Business module for achievements / badges: the read+award service plus the CDC
 * listener that awards on `xp_histories` / `enrollments` changes. Exports the
 * service so the GraphQL leaf (and inline write paths) can read + recompute.
 */
@Module({
    providers: [
        AchievementsService,
        AchievementsListener,
    ],
    exports: [
        AchievementsService,
    ],
})
export class AchievementsModule extends ConfigurableModuleClass {}
