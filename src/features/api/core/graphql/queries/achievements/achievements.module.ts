import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./achievements.module-definition"
import {
    MyAchievementsSingleQueryModule,
} from "./my-achievements"

/**
 * Achievements query group — profile badge leaves. Currently the single
 * `myAchievements` leaf (every definition + the viewer's earned status +
 * progress); registered global so its resolver is picked up by the schema.
 */
@Module({
    imports: [
        MyAchievementsSingleQueryModule.register({
            isGlobal: true,
        }),
    ],
})
export class AchievementsQueriesModule extends ConfigurableModuleClass {}
