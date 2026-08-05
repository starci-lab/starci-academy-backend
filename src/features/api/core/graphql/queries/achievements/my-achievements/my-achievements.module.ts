import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./my-achievements.module-definition"
import {
    MyAchievementsResolver,
} from "./my-achievements.resolver"

@Module({
    providers: [
        MyAchievementsResolver,
    ],
})
/**
 * Registers {@link MyAchievementsResolver} as a leaf query module — the schema
 * discovers the `myAchievements` operation through this registration, per
 * [[naming-and-structure]] §5.
 */
export class MyAchievementsSingleQueryModule extends ConfigurableModuleClass {}
