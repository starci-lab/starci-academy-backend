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
export class MyAchievementsSingleQueryModule extends ConfigurableModuleClass {}
