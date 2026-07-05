import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./my-pickable-cv-achievements.module-definition"
import {
    MyPickableCvAchievementsResolver,
} from "./my-pickable-cv-achievements.resolver"
import {
    MyPickableCvAchievementsService,
} from "./my-pickable-cv-achievements.service"
import {
    MyPickableCvAchievementsHandler,
} from "./my-pickable-cv-achievements.handler"

@Module({
    providers: [
        MyPickableCvAchievementsResolver,
        MyPickableCvAchievementsService,
        MyPickableCvAchievementsHandler,
    ],
})
export class MyPickableCvAchievementsSingleQueryModule extends ConfigurableModuleClass {}
