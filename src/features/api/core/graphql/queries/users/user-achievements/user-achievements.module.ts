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
export class UserAchievementsSingleQueryModule extends ConfigurableModuleClass {}
