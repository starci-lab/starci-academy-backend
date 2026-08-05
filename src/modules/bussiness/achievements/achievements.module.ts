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
    AchievementProjectionListener,
} from "./achievements.projection.listener"
import {
    AbstractBadge,
} from "./badges/abstract-badge"
import {
    ACHIEVEMENT_BADGES,
    ACHIEVEMENT_BADGE_PROVIDERS,
} from "./badges"

@Module({
    providers: [
        ...ACHIEVEMENT_BADGE_PROVIDERS,
        {
            // every badge service collected into one injectable array
            provide: ACHIEVEMENT_BADGES,
            useFactory: (...badges: Array<AbstractBadge>) => badges,
            inject: ACHIEVEMENT_BADGE_PROVIDERS,
        },
        AchievementsService,
        AchievementProjectionListener,
    ],
    exports: [
        AchievementsService,
    ],
})
/**
 * Business module for achievements / badges. Awards are computed on-read by
 * {@link AchievementsService}; each badge (animal) is its own
 * {@link AbstractBadge} service, all folded into the {@link ACHIEVEMENT_BADGES}
 * token. Exports the service so the GraphQL leaf (and inline write paths) can
 * read + recompute.
 */
export class AchievementsModule extends ConfigurableModuleClass {}
