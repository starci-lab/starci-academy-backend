import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./user-achievements.module-definition"
import {
    UserAchievementsResolver,
} from "./user-achievements.resolver"

@Module({
    providers: [
        UserAchievementsResolver,
    ],
})
/**
 * Registers {@link UserAchievementsResolver} as a leaf query module — the schema
 * discovers the `userAchievements` operation through this registration, per
 * [[naming-and-structure]] §5.
 */
export class UserAchievementsSingleQueryModule extends ConfigurableModuleClass {}
